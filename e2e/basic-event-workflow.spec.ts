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

  // 알림이나 다이얼로그가 버튼을 가리는 것을 방지하기 위해 force 클릭 사용
  await page.locator('[data-testid="event-submit-button"]').click({ force: true });
};

test.describe('기본 일정 관리 CRUD 테스트', () => {
  test.beforeEach(async ({ page }) => {
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

    await expect(page.getByTestId('event-list').getByText('퇴사 파티')).toBeVisible({
      timeout: 10000,
    });
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

    await expect(page.getByTestId('event-list').getByText('팀 회의')).toBeVisible();
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

    await expect(page.getByTestId('event-list').getByText('점심 약속')).toBeVisible();

    await page.getByLabel('Edit event').first().click();
    await page.getByLabel('제목').fill('저녁 약속');
    await page.locator('[data-testid="event-submit-button"]').click({ force: true });

    await expect(page.getByTestId('event-list').getByText('저녁 약속')).toBeVisible();
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

    await expect(page.getByTestId('event-list').getByText('운동')).toBeVisible();

    await page.getByLabel('Delete event').first().click();
    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  });
});
