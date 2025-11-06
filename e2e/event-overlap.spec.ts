import { test, expect, Page } from '@playwright/test';

interface CreateEventParams {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  category?: string;
}

/**
 * 이벤트가 리스트에 나타날 때까지 대기하는 헬퍼 함수
 */
const waitForEventInList = async (page: Page, eventTitle: string, timeout = 10000) => {
  const eventList = page.getByTestId('event-list');
  await expect(async () => {
    await eventList.waitFor({ state: 'attached' });
    const event = eventList.getByText(eventTitle).first();
    const isVisible = await event.isVisible();
    expect(isVisible).toBe(true);
  }).toPass({ timeout, intervals: [100] });
};

/**
 * 이벤트를 생성하는 헬퍼 함수
 * 네트워크 요청 완료와 DOM 업데이트를 안정적으로 대기
 */
const createEvent = async (page: Page, params: CreateEventParams, handleOverlap = true) => {
  // 폼 필드 입력
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

  // 폼 제출
  await page.getByTestId('event-submit-button').click();

  // 겹침 다이얼로그 확인 및 처리
  const dialog = page.getByRole('dialog');
  const isOverlapDialogVisible = await dialog
    .getByText('일정 겹침 경고')
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isOverlapDialogVisible) {
    if (handleOverlap) {
      // 다이얼로그가 있으면, "계속 진행" 클릭 후 API 요청이 발생함
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/events') &&
          response.request().method() === 'POST' &&
          (response.status() === 201 || response.status() === 200)
      );

      await page.getByRole('button', { name: '계속 진행' }).click();
      await expect(dialog).toBeHidden({ timeout: 5000 });

      // API 응답 대기
      await responsePromise;

      // 이벤트가 리스트에 나타날 때까지 대기
      await waitForEventInList(page, params.title, 10000);

      // 폼이 리셋될 때까지 대기
      await expect(page.getByLabel('제목')).toHaveValue('', { timeout: 5000 });
    }
    // handleOverlap이 false면 다이얼로그를 그대로 두고 반환
  } else {
    // 다이얼로그가 없으면 바로 API 요청이 발생함
    if (handleOverlap) {
      await page.waitForResponse(
        (response) =>
          response.url().includes('/api/events') &&
          response.request().method() === 'POST' &&
          (response.status() === 201 || response.status() === 200),
        { timeout: 10000 }
      );

      // 이벤트가 리스트에 나타날 때까지 대기
      await waitForEventInList(page, params.title, 10000);

      // 폼이 리셋될 때까지 대기
      await expect(page.getByLabel('제목')).toHaveValue('', { timeout: 5000 });
    }
  }
};

test.describe('일정 겹침 처리 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 이벤트 삭제 (병렬 처리로 속도 향상)
    const response = await page.request.get('http://localhost:3000/api/events');
    const data = await response.json();
    if (data.events && data.events.length > 0) {
      await Promise.all(
        data.events.map((event: { id: string }) =>
          page.request.delete(`http://localhost:3000/api/events/${event.id}`)
        )
      );
    }

    // 반복 일정도 삭제
    try {
      const recurringResponse = await page.request.get(
        'http://localhost:3000/api/recurring-events'
      );
      const recurringData = await recurringResponse.json();
      if (recurringData.recurringEvents && recurringData.recurringEvents.length > 0) {
        await Promise.all(
          recurringData.recurringEvents.map((recurringEvent: { id: string }) =>
            page.request.delete(`http://localhost:3000/api/recurring-events/${recurringEvent.id}`)
          )
        );
      }
    } catch {
      // API가 없으면 무시
    }

    // 삭제 완료 확인
    await expect(async () => {
      const checkResponse = await page.request.get('http://localhost:3000/api/events');
      const checkData = await checkResponse.json();
      expect(checkData.events.length).toBe(0);
    }).toPass({ timeout: 5000, intervals: [200] });

    // 페이지 로드 및 상태 정리
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 폼이 준비될 때까지 대기
    await expect(page.getByTestId('event-submit-button')).toBeVisible({
      timeout: 10000,
    });
  });

  test('겹치는 단일 일정을 생성할 때 경고 다이얼로그가 표시된다', async ({ page }) => {
    await createEvent(page, {
      title: '기존 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    // 이벤트가 리스트에 나타났는지 확인 (createEvent에서 이미 대기하지만 재확인)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({
      timeout: 5000,
    });

    await createEvent(
      page,
      {
        title: '겹치는 일정',
        date: '2025-11-25',
        startTime: '10:30',
        endTime: '11:30',
        category: '개인',
      },
      false
    );

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('일정 겹침 경고')).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('다음 일정과 겹칩니다:')).toBeVisible();
    await expect(dialog.getByText('기존 일정').first()).toBeVisible();
  });

  test('겹침 경고 다이얼로그에서 취소를 선택하면 일정이 생성되지 않는다', async ({ page }) => {
    await createEvent(page, {
      title: '기존 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    // 이벤트가 리스트에 나타났는지 확인 (createEvent에서 이미 대기하지만 재확인)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({
      timeout: 5000,
    });

    await createEvent(
      page,
      {
        title: '겹치는 일정',
        date: '2025-11-25',
        startTime: '10:30',
        endTime: '11:30',
        category: '개인',
      },
      false
    );

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('일정 겹침 경고')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: '취소' }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    // 겹치는 일정이 생성되지 않았는지 확인
    await expect(async () => {
      const count = await eventList.getByText('겹치는 일정').count();
      expect(count).toBe(0);
    }).toPass({ timeout: 5000, intervals: [100] });

    // 기존 일정이 여전히 보이는지 확인
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('겹침 경고 다이얼로그에서 계속 진행을 선택하면 일정이 생성된다', async ({ page }) => {
    await createEvent(page, {
      title: '기존 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    // 이벤트가 리스트에 나타났는지 확인 (createEvent에서 이미 대기하지만 재확인)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({
      timeout: 5000,
    });

    await createEvent(
      page,
      {
        title: '겹치는 일정',
        date: '2025-11-25',
        startTime: '10:30',
        endTime: '11:30',
        category: '개인',
      },
      false
    );

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('일정 겹침 경고')).toBeVisible({ timeout: 5000 });

    // 네트워크 요청 완료를 기다리면서 "계속 진행" 클릭
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/events') &&
        response.request().method() === 'POST' &&
        (response.status() === 201 || response.status() === 200)
    );

    await page.getByRole('button', { name: '계속 진행' }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    // API 응답 대기
    await responsePromise;

    // 겹치는 일정이 리스트에 나타날 때까지 재시도
    await expect(async () => {
      const event = eventList.getByText('겹치는 일정').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [100] });

    // 기존 일정이 여전히 보이는지 확인
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('반복 일정과 단일 일정은 겹쳐도 경고가 표시되지 않는다', async ({ page }) => {
    await createEvent(page, {
      title: '단일 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    // 이벤트가 리스트에 나타났는지 확인 (createEvent에서 이미 대기하지만 재확인)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('단일 일정').first()).toBeVisible({
      timeout: 5000,
    });

    // 반복 일정 생성
    await page.getByLabel('제목').fill('반복 일정');
    await page.getByLabel('날짜').fill('2025-11-25');
    await page.getByLabel('시작 시간').fill('10:30');
    await page.getByLabel('종료 시간').fill('11:30');
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'daily-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-30');

    // 네트워크 요청 완료를 기다리면서 제출
    const responsePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/events-list') || response.url().includes('/api/events')) &&
        response.request().method() === 'POST' &&
        (response.status() === 201 || response.status() === 200)
    );

    await page.getByTestId('event-submit-button').click();

    // API 응답 대기
    await responsePromise;

    // 반복 일정이 리스트에 나타날 때까지 재시도
    await expect(async () => {
      const event = eventList.getByText('반복 일정').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [100] });

    // 겹침 경고 다이얼로그가 나타나지 않았는지 확인
    const dialog = page.getByRole('dialog');
    const isDialogVisible = await dialog
      .getByText('일정 겹침 경고')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    expect(isDialogVisible).toBe(false);
  });

  test('반복 일정끼리 겹치면 경고가 표시된다', async ({ page }) => {
    // 첫 번째 반복 일정 생성
    await page.getByLabel('제목').fill('첫 번째 반복 일정');
    await page.getByLabel('날짜').fill('2025-11-25');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'daily-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-30');

    // 네트워크 요청 완료를 기다리면서 제출
    const firstResponsePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/events-list') || response.url().includes('/api/events')) &&
        response.request().method() === 'POST' &&
        (response.status() === 201 || response.status() === 200)
    );

    await page.getByTestId('event-submit-button').click();

    // API 응답 대기
    await firstResponsePromise;

    const eventList = page.getByTestId('event-list');
    // 첫 번째 반복 일정이 리스트에 나타날 때까지 재시도
    await expect(async () => {
      const event = eventList.getByText('첫 번째 반복 일정').first();
      const isVisible = await event.isVisible();
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [100] });

    // 두 번째 반복 일정 생성
    await page.getByLabel('제목').fill('두 번째 반복 일정');
    await page.getByLabel('날짜').fill('2025-11-25');
    await page.getByLabel('시작 시간').fill('10:30');
    await page.getByLabel('종료 시간').fill('11:30');
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'daily-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-30');
    await page.getByTestId('event-submit-button').click();

    // 겹침 경고 다이얼로그가 나타나는지 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('일정 겹침 경고')).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('첫 번째 반복 일정').first()).toBeVisible();
  });
});
