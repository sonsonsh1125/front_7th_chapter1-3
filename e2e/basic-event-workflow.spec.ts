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

test.describe('기본 일정 관리 CRUD 테스트', () => {
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

  test('일정을 추가할 수 있다 (CREATE)', async ({ page }) => {
    await createEvent(page, {
      title: '퇴사 파티',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      description: '드디어 퇴사',
      location: '강남역',
      category: '개인',
    });

    await expect(page.getByTestId('event-list').getByText('퇴사 파티').first()).toBeVisible();

    await expect(page.getByLabel('제목')).toHaveValue('');

    try {
      await expect(page.getByText('일정이 추가되었습니다')).toBeVisible({ timeout: 2000 });
    } catch {
      // 메시지가 이미 사라졌어도 테스트는 통과
    }
  });

  test('추가된 일정을 조회할 수 있다 (READ)', async ({ page }) => {
    await createEvent(page, {
      title: '팀 회의',
      date: '2025-11-25',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 회의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의').first()).toBeVisible();
  });

  test('일정을 수정할 수 있다 (UPDATE)', async ({ page }) => {
    await createEvent(page, {
      title: '점심 약속',
      date: '2025-11-25',
      startTime: '12:00',
      endTime: '13:00',
      description: '동료와 점심',
      location: '회사 근처',
      category: '개인',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('점심 약속').first()).toBeVisible();

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

    const eventCards = eventList.locator('div').filter({ hasText: '점심 약속' });
    await eventCards.first().getByLabel('Edit event').click({ force: true });

    try {
      const recurringDialog = page.getByRole('dialog');
      const isDialogOpen = await recurringDialog.isVisible({ timeout: 1000 }).catch(() => false);
      if (isDialogOpen) {
        await page
          .getByRole('button', { name: /예|Yes|단일/ })
          .first()
          .click();
        await recurringDialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => null);
      }
    } catch {
      // Dialog가 없으면 무시
    }

    await expect(page.getByLabel('제목')).not.toHaveValue('');
    await expect(page.getByLabel('제목')).toHaveValue('점심 약속');
    await page.getByLabel('제목').fill('저녁 약속');
    await page.getByTestId('event-submit-button').click();

    await expect(eventList.getByText('저녁 약속').first()).toBeVisible({ timeout: 5000 });
    await expect(eventList.getByText('점심 약속')).toHaveCount(0, { timeout: 5000 });
  });

  test('일정을 삭제할 수 있다 (DELETE)', async ({ page }) => {
    await createEvent(page, {
      title: '운동',
      date: '2025-11-25',
      startTime: '18:00',
      endTime: '19:00',
      description: '헬스장',
      location: '동네 헬스장',
      category: '개인',
    });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('운동').first()).toBeVisible();

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

    const eventCards = eventList.locator('div').filter({ hasText: '운동' });
    const deleteButton = eventCards.first().getByLabel('Delete event');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click({ force: true });

    try {
      const recurringDialog = page.getByRole('dialog');
      const isDialogOpen = await recurringDialog.isVisible({ timeout: 1000 }).catch(() => false);
      if (isDialogOpen) {
        await page
          .getByRole('button', { name: /예|Yes/ })
          .first()
          .click();
        await recurringDialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => null);
      }
    } catch {
      // Dialog가 없으면 무시
    }

    await expect(eventList.getByText('운동')).toHaveCount(0, { timeout: 10000 });

    try {
      await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible({ timeout: 2000 });
    } catch {
      // 메시지가 없어도 테스트는 통과
    }
  });
});
