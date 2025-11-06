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

const createEvent = async (page: Page, params: CreateEventParams, handleOverlap = true) => {
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

  await page.getByTestId('event-submit-button').click();

  if (handleOverlap) {
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
  }
};

test.describe('일정 겹침 처리 테스트', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/events');
    const data = await response.json();
    if (data.events && data.events.length > 0) {
      for (const event of data.events) {
        await page.request.delete(`http://localhost:3000/api/events/${event.id}`);
      }
    }

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

  test('겹치는 단일 일정을 생성할 때 경고 다이얼로그가 표시된다', async ({ page }) => {
    await createEvent(page, {
      title: '기존 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({ timeout: 5000 });

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

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({ timeout: 5000 });

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
    await dialog.waitFor({ state: 'hidden', timeout: 2000 });

    await expect(eventList.getByText('겹치는 일정')).toHaveCount(0);
    await expect(eventList.getByText('기존 일정').first()).toBeVisible();
  });

  test('겹침 경고 다이얼로그에서 계속 진행을 선택하면 일정이 생성된다', async ({ page }) => {
    await createEvent(page, {
      title: '기존 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('기존 일정').first()).toBeVisible({ timeout: 5000 });

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

    await page.getByRole('button', { name: '계속 진행' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 2000 });

    await expect(eventList.getByText('겹치는 일정').first()).toBeVisible({ timeout: 5000 });
    await expect(eventList.getByText('기존 일정').first()).toBeVisible();
  });

  test('반복 일정과 단일 일정은 겹쳐도 경고가 표시되지 않는다', async ({ page }) => {
    await createEvent(page, {
      title: '단일 일정',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('단일 일정').first()).toBeVisible({ timeout: 5000 });

    await page.getByLabel('제목').fill('반복 일정');
    await page.getByLabel('날짜').fill('2025-11-25');
    await page.getByLabel('시작 시간').fill('10:30');
    await page.getByLabel('종료 시간').fill('11:30');
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'daily-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-30');
    await page.getByTestId('event-submit-button').click();

    await expect(eventList.getByText('반복 일정').first()).toBeVisible({ timeout: 10000 });

    const dialog = page.getByRole('dialog');
    const isDialogVisible = await dialog
      .getByText('일정 겹침 경고')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    expect(isDialogVisible).toBe(false);
  });

  test('반복 일정끼리 겹치면 경고가 표시된다', async ({ page }) => {
    await page.getByLabel('제목').fill('첫 번째 반복 일정');
    await page.getByLabel('날짜').fill('2025-11-25');
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('11:00');
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: 'daily-option' }).click();
    await page.getByLabel('반복 간격').fill('1');
    await page.getByLabel('반복 종료일').fill('2025-11-30');
    await page.getByTestId('event-submit-button').click();

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('첫 번째 반복 일정').first()).toBeVisible({ timeout: 10000 });

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

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('일정 겹침 경고')).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('첫 번째 반복 일정').first()).toBeVisible();
  });
});
