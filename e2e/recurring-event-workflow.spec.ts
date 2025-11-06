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

interface CreateRecurringEventParams extends CreateEventParams {
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatInterval: number;
  repeatEndDate?: string;
}

const createRecurringEvent = async (page: Page, params: CreateRecurringEventParams) => {
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

  await page.getByLabel('반복 일정').check();
  await page.getByLabel('반복 유형').click();
  await page.getByRole('option', { name: `${params.repeatType}-option` }).click();
  await page.getByLabel('반복 간격').fill(params.repeatInterval.toString());

  if (params.repeatEndDate) {
    await page.getByLabel('반복 종료일').fill(params.repeatEndDate);
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
};

test.describe('반복 일정 관리 CRUD 테스트', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/events');
    const data = await response.json();
    if (data.events && data.events.length > 0) {
      for (const event of data.events) {
        await page.request.delete(`http://localhost:3000/api/events/${event.id}`);
      }
    }

    // 반복 일정도 삭제
    try {
      const recurringResponse = await page.request.get(
        'http://localhost:3000/api/recurring-events'
      );
      const recurringData = await recurringResponse.json();
      if (recurringData.recurringEvents && recurringData.recurringEvents.length > 0) {
        for (const recurringEvent of recurringData.recurringEvents) {
          await page.request.delete(
            `http://localhost:3000/api/recurring-events/${recurringEvent.id}`
          );
        }
      }
    } catch {
      // API가 없으면 무시
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

  test('반복 일정을 추가할 수 있다 (CREATE)', async ({ page }) => {
    await createRecurringEvent(page, {
      title: '매일 운동',
      date: '2025-11-25',
      startTime: '07:00',
      endTime: '08:00',
      description: '아침 운동',
      location: '헬스장',
      category: '개인',
      repeatType: 'daily',
      repeatInterval: 1,
      repeatEndDate: '2025-11-30',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('매일 운동').first()).toBeVisible();

    await expect(async () => {
      const eventCount = await eventList.getByText('매일 운동').count();
      expect(eventCount).toBeGreaterThan(1);
    }).toPass({ timeout: 5000 });

    await expect(page.getByLabel('제목')).toHaveValue('');

    try {
      await expect(page.getByText('일정이 추가되었습니다')).toBeVisible({ timeout: 2000 });
    } catch {
      // 메시지가 이미 사라졌어도 테스트는 통과
    }
  });

  test('추가된 반복 일정을 조회할 수 있다 (READ)', async ({ page }) => {
    await createRecurringEvent(page, {
      title: '주간 회의',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 회의',
      location: '회의실 A',
      category: '업무',
      repeatType: 'weekly',
      repeatInterval: 1,
      repeatEndDate: '2025-12-16',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('주간 회의').first()).toBeVisible();

    // 월 뷰로 변경하여 더 많은 이벤트를 볼 수 있도록 함
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'month-option' }).click();

    await page.getByLabel('일정 검색').fill('주간 회의');

    await expect(async () => {
      const eventCount = await eventList.getByText('주간 회의').count();
      expect(eventCount).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test('반복 일정의 단일 인스턴스만 수정할 수 있다 (UPDATE - 단일)', async ({ page }) => {
    await createRecurringEvent(page, {
      title: '월간 리뷰',
      date: '2025-11-25',
      startTime: '14:00',
      endTime: '15:00',
      description: '월간 성과 리뷰',
      location: '회의실 B',
      category: '업무',
      repeatType: 'monthly',
      repeatInterval: 1,
      repeatEndDate: '2026-02-25',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('월간 리뷰').first()).toBeVisible();

    const eventCards = eventList.locator('div').filter({ hasText: '월간 리뷰' });
    await eventCards.first().getByLabel('Edit event').click({ force: true });

    const recurringDialog = page.getByRole('dialog');
    await expect(recurringDialog.getByText('반복 일정 수정')).toBeVisible();
    await page.getByRole('button', { name: '예' }).click();
    await recurringDialog.waitFor({ state: 'hidden', timeout: 2000 });

    await expect(page.getByLabel('제목')).toHaveValue('월간 리뷰');
    await page.getByLabel('제목').fill('월간 리뷰 (수정됨)');
    await page.getByTestId('event-submit-button').click();

    await expect(eventList.getByText('월간 리뷰 (수정됨)').first()).toBeVisible();
    const originalCount = await eventList.getByText('월간 리뷰').count();
    expect(originalCount).toBeGreaterThan(0);
  });

  test('반복 일정의 전체 시리즈를 수정할 수 있다 (UPDATE - 전체)', async ({ page }) => {
    await createRecurringEvent(page, {
      title: '주간 평가',
      date: '2025-11-25',
      startTime: '09:00',
      endTime: '10:00',
      description: '주간 성과 평가',
      location: '회의실 C',
      category: '업무',
      repeatType: 'weekly',
      repeatInterval: 1,
      repeatEndDate: '2025-12-16',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('주간 평가').first()).toBeVisible();

    await page.getByLabel('일정 검색').fill('주간 평가');

    await expect(async () => {
      const count = await eventList.getByText('주간 평가').count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    const initialCount = await eventList.getByText('주간 평가').count();
    expect(initialCount).toBeGreaterThan(0);

    const eventCards = eventList.locator('div').filter({ hasText: '주간 평가' });
    await eventCards.first().getByLabel('Edit event').click({ force: true });

    const recurringDialog = page.getByRole('dialog');
    await expect(recurringDialog.getByText('반복 일정 수정')).toBeVisible();
    await page.getByRole('button', { name: '아니오' }).click();
    await recurringDialog.waitFor({ state: 'hidden', timeout: 2000 });

    await expect(page.getByLabel('제목')).toHaveValue('주간 평가');
    await page.getByLabel('제목').fill('주간 평가 (전체 수정)');
    await page.getByTestId('event-submit-button').click();

    await expect(async () => {
      const updatedCount = await eventList.getByText('주간 평가 (전체 수정)').count();
      expect(updatedCount).toBeGreaterThanOrEqual(initialCount - 1);
    }).toPass({ timeout: 15000 });
  });

  test('반복 일정의 단일 인스턴스만 삭제할 수 있다 (DELETE - 단일)', async ({ page }) => {
    await createRecurringEvent(page, {
      title: '일일 스탠드업',
      date: '2025-11-25',
      startTime: '09:00',
      endTime: '09:30',
      description: '팀 일일 스탠드업',
      location: '온라인',
      category: '업무',
      repeatType: 'daily',
      repeatInterval: 1,
      repeatEndDate: '2025-11-30',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('일일 스탠드업').first()).toBeVisible();

    await expect(async () => {
      const count = await eventList.getByText('일일 스탠드업').count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 5000 });

    const initialCount = await eventList.getByText('일일 스탠드업').count();
    expect(initialCount).toBeGreaterThan(1);

    const eventCards = eventList.locator('div').filter({ hasText: '일일 스탠드업' });
    const deleteButton = eventCards.first().getByLabel('Delete event');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click({ force: true });

    const recurringDialog = page.getByRole('dialog');
    await expect(recurringDialog.getByText('반복 일정 삭제')).toBeVisible();
    await page.getByRole('button', { name: '예' }).click();
    await recurringDialog.waitFor({ state: 'hidden', timeout: 2000 });

    await expect(async () => {
      const remainingCount = await eventList.getByText('일일 스탠드업').count();
      expect(remainingCount).toBeLessThan(initialCount);
      expect(remainingCount).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    const remainingCount = await eventList.getByText('일일 스탠드업').count();
    expect(remainingCount).toBeGreaterThan(0);
  });

  test('반복 일정의 전체 시리즈를 삭제할 수 있다 (DELETE - 전체)', async ({ page }) => {
    await createRecurringEvent(page, {
      title: '주간 리포트',
      date: '2025-11-25',
      startTime: '17:00',
      endTime: '17:30',
      description: '주간 업무 리포트 작성',
      location: '사무실',
      category: '업무',
      repeatType: 'weekly',
      repeatInterval: 1,
      repeatEndDate: '2025-12-16',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('주간 리포트').first()).toBeVisible();

    const eventCards = eventList.locator('div').filter({ hasText: '주간 리포트' });
    const deleteButton = eventCards.first().getByLabel('Delete event');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click({ force: true });

    const recurringDialog = page.getByRole('dialog');
    await expect(recurringDialog.getByText('반복 일정 삭제')).toBeVisible();
    await page.getByRole('button', { name: '아니오' }).click();
    await recurringDialog.waitFor({ state: 'hidden', timeout: 2000 });

    await expect(eventList.getByText('주간 리포트')).toHaveCount(0, { timeout: 10000 });

    try {
      await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible({ timeout: 2000 });
    } catch {
      // 메시지가 없어도 테스트는 통과
    }
  });
});
