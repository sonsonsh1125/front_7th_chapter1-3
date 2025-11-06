import { test, expect, Page } from '@playwright/test';

interface CreateEventParams {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  category?: string;
  notificationTime?: number;
}

const createEvent = async (page: Page, params: CreateEventParams) => {
  await page.getByLabel('제목').fill(params.title);
  await page.getByLabel('날짜').fill(params.date);
  await page.getByLabel('시작 시간').fill(params.startTime);
  await page.getByLabel('종료 시간').fill(params.endTime);

  if (params.description) {
    await page.getByLabel('설명').fill(params.description);
  }

  if (params.location) {
    await page.getByLabel('위치').fill(params.location);
  }

  if (params.category) {
    await page.getByLabel('카테고리').click();
    await page.getByRole('option', { name: `${params.category}-option` }).click();
  }

  if (params.notificationTime) {
    // 알림 설정 Select 찾기 - id를 우선 사용
    const notificationSelect = page.locator('#notification');
    await expect(notificationSelect).toBeVisible({ timeout: 5000 });
    await notificationSelect.click();

    let notificationLabel = '1분 전';
    if (params.notificationTime === 1) {
      notificationLabel = '1분 전';
    } else if (params.notificationTime === 10) {
      notificationLabel = '10분 전';
    } else if (params.notificationTime === 60) {
      notificationLabel = '1시간 전';
    } else if (params.notificationTime === 120) {
      notificationLabel = '2시간 전';
    } else if (params.notificationTime === 1440) {
      notificationLabel = '1일 전';
    }

    // 옵션이 나타날 때까지 대기
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: notificationLabel }).click();
  }

  await page.getByTestId('event-submit-button').click();

  try {
    const dialogTitle = page.getByText('일정 겹침 경고');
    const isDialogVisible = await dialogTitle.isVisible({ timeout: 1000 }).catch(() => false);
    if (isDialogVisible) {
      await page.getByRole('button', { name: '계속 진행' }).click();
      await dialogTitle.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => null);
    }
  } catch {
    // Dialog가 없으면 무시
  }

  // 이벤트가 저장되고 리스트가 업데이트될 때까지 대기
  // 성공 메시지가 나타나거나 폼이 리셋되는 것을 기다림
  try {
    // 성공 메시지가 나타날 수 있음
    await page.waitForTimeout(500);
    // 폼이 리셋되었는지 확인 (제목 필드가 비어있는지)
    await expect(page.getByLabel('제목'))
      .toHaveValue('', { timeout: 3000 })
      .catch(() => {
        // 폼이 리셋되지 않아도 계속 진행
      });
  } catch {
    // 무시하고 계속 진행
  }
};

// 현재 시간으로부터 지정된 분 후의 시간을 계산하는 헬퍼 함수
const getTimeAfterMinutes = (minutes: number): string => {
  const now = new Date();
  const futureTime = new Date(now.getTime() + minutes * 60 * 1000);
  const hours = String(futureTime.getHours()).padStart(2, '0');
  const mins = String(futureTime.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

// 현재 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 알림이 표시되는지 확인하는 헬퍼 함수
const waitForNotification = async (
  page: Page,
  eventTitle: string,
  notificationTime: number,
  timeout: number = 70000
) => {
  const expectedMessage = `${notificationTime}분 후 ${eventTitle} 일정이 시작됩니다.`;
  await expect(async () => {
    // AlertTitle을 포함한 Alert를 찾습니다
    const alert = page.getByText(expectedMessage);
    const isVisible = await alert.isVisible();
    expect(isVisible).toBe(true);
  }).toPass({ timeout });
  return page.getByText(expectedMessage);
};

test.describe('알림 시스템 노출 조건 검증', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/events');
    const data = await response.json();
    if (data.events && data.events.length > 0) {
      for (const event of data.events) {
        await page.request.delete(`http://localhost:3000/api/events/${event.id}`);
      }
    }

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload();
    await expect(page.getByTestId('event-submit-button')).toBeVisible();
  });

  test('notificationTime 이내에 있는 이벤트에 대해 알림이 표시되어야 한다', async ({ page }) => {
    const today = getTodayDate();
    // 알림이 즉시 표시되도록 이벤트 시작 시간을 notificationTime과 동일하게 설정
    // 예: 1분 전 알림이면 1분 후에 시작하는 이벤트 생성
    const startTime = getTimeAfterMinutes(1); // 1분 후
    const endTime = getTimeAfterMinutes(2); // 2분 후

    await createEvent(page, {
      title: '알림 테스트 이벤트',
      date: today,
      startTime,
      endTime,
      notificationTime: 1, // 1분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    // 네트워크 요청이 완료되고 리스트가 업데이트될 때까지 충분히 대기
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      // 리스트가 로드될 때까지 대기
      await eventList.waitFor({ state: 'attached', timeout: 5000 });
      const event = eventList.getByText('알림 테스트 이벤트').first();
      const isVisible = await event.isVisible({ timeout: 2000 });
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });

    // 알림이 표시될 때까지 대기 (최대 70초: 1분 + 10초 여유)
    const alert = await waitForNotification(page, '알림 테스트 이벤트', 1, 70000);
    await expect(alert).toBeVisible();

    // 알림 메시지 내용 확인
    const messageText = await alert.textContent();
    expect(messageText).toContain('1분 후');
    expect(messageText).toContain('알림 테스트 이벤트');
    expect(messageText).toContain('일정이 시작됩니다');
  });

  test('notificationTime을 넘어선 이벤트에 대해 알림이 표시되지 않아야 한다', async ({ page }) => {
    const today = getTodayDate();
    // notificationTime보다 훨씬 나중에 시작하는 이벤트 생성
    // 이벤트가 20분 후에 시작하고 notificationTime이 10분이면,
    // 현재는 timeDiff(20분) > notificationTime(10분)이므로 알림이 표시되지 않아야 함
    const startTime = getTimeAfterMinutes(20); // 20분 후
    const endTime = getTimeAfterMinutes(21); // 21분 후

    await createEvent(page, {
      title: '알림 시간 초과 테스트',
      date: today,
      startTime,
      endTime,
      notificationTime: 10, // 10분 전 알림 (20분 후 시작이므로 즉시 알림이 표시되지 않아야 함)
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      const event = eventList.getByText('알림 시간 초과 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 5초 동안 알림이 표시되지 않는지 확인
    // (20분 > 10분이므로 아직 알림 조건을 만족하지 않음)
    // 알림은 1초마다 체크되므로, 5초면 충분히 확인 가능
    await page.waitForTimeout(5000);

    // 알림 Alert가 표시되지 않는지 확인
    // 정확한 메시지 형식으로 찾기: "10분 후 알림 시간 초과 테스트 일정이 시작됩니다."
    // 또는 더 안전하게 모든 알림을 확인
    const allAlerts = page.locator('div[role="alert"]');
    const alertCount = await allAlerts.count();

    if (alertCount > 0) {
      // 알림이 있다면, 우리 이벤트와 관련된 알림이 없는지 확인
      const ourAlert = page.getByText('10분 후 알림 시간 초과 테스트 일정이 시작됩니다.');
      await expect(ourAlert).not.toBeVisible({ timeout: 1000 });
    }
  });

  test('이미 알림이 발생한 이벤트에 대해 중복 알림이 발생하지 않아야 한다', async ({ page }) => {
    const today = getTodayDate();
    const startTime = getTimeAfterMinutes(1); // 1분 후
    const endTime = getTimeAfterMinutes(2); // 2분 후

    await createEvent(page, {
      title: '중복 알림 방지 테스트',
      date: today,
      startTime,
      endTime,
      notificationTime: 1, // 1분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      const event = eventList.getByText('중복 알림 방지 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 첫 번째 알림이 표시될 때까지 대기
    const firstAlert = await waitForNotification(page, '중복 알림 방지 테스트', 1, 70000);
    await expect(firstAlert).toBeVisible();

    // 알림이 하나만 있는지 확인
    const alerts = page.locator('div[role="alert"]').filter({ hasText: /중복 알림 방지 테스트/ });
    const alertCount = await alerts.count();
    expect(alertCount).toBe(1);

    // 10초 더 대기하여 중복 알림이 발생하지 않는지 확인
    await page.waitForTimeout(10000);

    // 알림 개수가 여전히 1개인지 확인
    const newAlertCount = await alerts.count();
    expect(newAlertCount).toBe(1);
  });

  test('알림 메시지가 올바른 형식으로 표시되어야 한다', async ({ page }) => {
    const today = getTodayDate();
    const startTime = getTimeAfterMinutes(1); // 1분 후
    const endTime = getTimeAfterMinutes(2); // 2분 후

    await createEvent(page, {
      title: '메시지 형식 테스트',
      date: today,
      startTime,
      endTime,
      notificationTime: 1, // 1분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      const event = eventList.getByText('메시지 형식 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 알림이 표시될 때까지 대기
    const alert = await waitForNotification(page, '메시지 형식 테스트', 1, 70000);
    await expect(alert).toBeVisible();

    // 알림 메시지 형식 확인: "{notificationTime}분 후 {title} 일정이 시작됩니다."
    const messageText = await alert.textContent();
    expect(messageText).toContain('1분 후');
    expect(messageText).toContain('메시지 형식 테스트');
    expect(messageText).toContain('일정이 시작됩니다');
  });

  test('다양한 notificationTime 설정에 대해 알림이 올바르게 표시되어야 한다', async ({ page }) => {
    const today = getTodayDate();
    // 10분 후 시작하는 이벤트 (10분 전 알림)
    const startTime10 = getTimeAfterMinutes(10);
    const endTime10 = getTimeAfterMinutes(11);

    await createEvent(page, {
      title: '10분 알림 테스트',
      date: today,
      startTime: startTime10,
      endTime: endTime10,
      notificationTime: 10, // 10분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      const event = eventList.getByText('10분 알림 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 알림이 표시될 때까지 대기 (10분 + 10초 여유)
    const alert = await waitForNotification(page, '10분 알림 테스트', 10, 610000);
    await expect(alert).toBeVisible();

    // 알림 메시지 확인
    const messageText = await alert.textContent();
    expect(messageText).toContain('10분 후');
    expect(messageText).toContain('10분 알림 테스트');
  });

  test('알림이 표시된 이벤트는 일정 리스트에서 알림 아이콘이 표시되어야 한다', async ({ page }) => {
    const today = getTodayDate();
    const startTime = getTimeAfterMinutes(1); // 1분 후
    const endTime = getTimeAfterMinutes(2); // 2분 후

    await createEvent(page, {
      title: '아이콘 표시 테스트',
      date: today,
      startTime,
      endTime,
      notificationTime: 1, // 1분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      const event = eventList.getByText('아이콘 표시 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 알림이 표시될 때까지 대기
    await waitForNotification(page, '아이콘 표시 테스트', 1, 70000);

    // 일정 리스트에서 알림 아이콘이 표시되는지 확인
    // notifiedEvents에 포함된 이벤트는 Notifications 아이콘이 표시됩니다
    const eventCard = eventList.locator('div').filter({ hasText: '아이콘 표시 테스트' }).first();
    await expect(eventCard).toBeVisible();

    // 이벤트 제목이 굵게 표시되는지 확인 (알림 상태 스타일)
    // App.tsx에서 알림된 이벤트는 Typography 컴포넌트의 fontWeight가 'bold'로 설정됨
    await expect(async () => {
      // 이벤트 카드 내에서 제목 텍스트를 포함한 요소 찾기
      // Typography 컴포넌트는 보통 p 태그로 렌더링됨
      const titleElement = eventCard.getByText('아이콘 표시 테스트').first();
      await expect(titleElement).toBeVisible({ timeout: 2000 });

      const fontWeight = await titleElement.evaluate(
        (el) => window.getComputedStyle(el).fontWeight
      );
      const weight = parseInt(fontWeight) || 400;
      expect(weight >= 700).toBe(true);
    }).toPass({ timeout: 10000 });
  });

  test('과거 시간의 이벤트에 대해서는 알림이 표시되지 않아야 한다', async ({ page }) => {
    const today = getTodayDate();
    const now = new Date();
    const pastTime = new Date(now.getTime() - 30 * 60 * 1000); // 30분 전
    const pastStartTime =
      String(pastTime.getHours()).padStart(2, '0') +
      ':' +
      String(pastTime.getMinutes()).padStart(2, '0');
    const pastEndTime =
      String(pastTime.getHours()).padStart(2, '0') +
      ':' +
      String(pastTime.getMinutes() + 1).padStart(2, '0');

    await createEvent(page, {
      title: '과거 이벤트 테스트',
      date: today,
      startTime: pastStartTime,
      endTime: pastEndTime,
      notificationTime: 10, // 10분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      const event = eventList.getByText('과거 이벤트 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 10초 동안 알림이 표시되지 않는지 확인
    await page.waitForTimeout(10000);

    // 알림 Alert가 표시되지 않는지 확인
    const alert = page.getByText(/과거 이벤트 테스트.*일정이 시작됩니다/);
    await expect(alert).not.toBeVisible({ timeout: 1000 });
  });

  test('정확한 notificationTime 경계에서 알림이 표시되어야 한다', async ({ page }) => {
    const today = getTodayDate();
    // notificationTime과 정확히 일치하는 시간에 시작하는 이벤트
    // 예: 1분 전 알림이면 정확히 1분 후에 시작
    const startTime = getTimeAfterMinutes(1); // 1분 후
    const endTime = getTimeAfterMinutes(2); // 2분 후

    await createEvent(page, {
      title: '경계값 테스트',
      date: today,
      startTime,
      endTime,
      notificationTime: 1, // 1분 전 알림
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    await expect(async () => {
      const eventList = page.getByTestId('event-list');
      const event = eventList.getByText('경계값 테스트').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000 });

    // 알림이 표시될 때까지 대기
    // getUpcomingEvents는 timeDiff > 0 && timeDiff <= notificationTime 조건을 확인하므로
    // 정확히 notificationTime일 때도 알림이 표시되어야 합니다
    const alert = await waitForNotification(page, '경계값 테스트', 1, 70000);
    await expect(alert).toBeVisible();
  });
});
