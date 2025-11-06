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

  // 이벤트가 저장되고 리스트가 업데이트될 때까지 대기
  try {
    await page.waitForTimeout(500);
    await expect(page.getByLabel('제목'))
      .toHaveValue('', { timeout: 3000 })
      .catch(() => {
        // 폼이 리셋되지 않아도 계속 진행
      });
  } catch {
    // 무시하고 계속 진행
  }
};

// 현재 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

test.describe('검색 및 필터링 CRUD 테스트', () => {
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

  test('검색어를 입력하여 필터링된 결과를 생성할 수 있다 (CREATE)', async ({ page }) => {
    const today = getTodayDate();

    // 여러 이벤트 생성
    await createEvent(page, {
      title: '팀 회의',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
    });

    await createEvent(page, {
      title: '점심 약속',
      date: today,
      startTime: '12:00',
      endTime: '13:00',
      description: '동료와 점심',
      location: '회사 근처 식당',
      category: '개인',
    });

    await createEvent(page, {
      title: '프로젝트 리뷰',
      date: today,
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 리뷰',
      location: '회의실 B',
      category: '업무',
    });

    // 모든 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      // 리스트가 로드될 때까지 대기
      await eventList.waitFor({ state: 'attached', timeout: 5000 });
      const count = await eventList
        .locator('div')
        .filter({ hasText: /팀 회의|점심 약속|프로젝트 리뷰/ })
        .count();
      expect(count).toBeGreaterThanOrEqual(3);
    }).toPass({ timeout: 15000, intervals: [500] });

    // 검색어 입력 (CREATE)
    // '팀'만 검색하여 '팀 회의'만 필터링 (부분 일치 검색이므로 '회의'로 검색하면 둘 다 나타남)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('팀');

    // 필터링된 결과가 생성되었는지 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 충분히 대기
      await page.waitForTimeout(1000);

      // '팀 회의'가 보이는지 확인
      const teamMeetingCount = await eventList.getByText('팀 회의').count();
      if (teamMeetingCount === 0) {
        throw new Error('팀 회의가 리스트에 없습니다');
      }

      const visibleEvents = eventList.getByText('팀 회의');
      const isVisible = await visibleEvents
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!isVisible) {
        throw new Error('팀 회의가 보이지 않습니다');
      }

      // 다른 이벤트는 보이지 않아야 함
      const lunchEventCount = await eventList.getByText('점심 약속').count();
      if (lunchEventCount > 0) {
        const lunchEvent = eventList.getByText('점심 약속').first();
        const isLunchVisible = await lunchEvent.isVisible({ timeout: 1000 }).catch(() => false);
        if (isLunchVisible) {
          throw new Error('점심 약속이 보입니다');
        }
      }

      expect(isVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });
  });

  test('검색 결과를 조회할 수 있다 (READ)', async ({ page }) => {
    const today = getTodayDate();

    // 검색 가능한 이벤트 생성
    await createEvent(page, {
      title: '회의',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: '중요한 회의',
      location: '회의실',
      category: '업무',
    });

    await createEvent(page, {
      title: '운동',
      date: today,
      startTime: '18:00',
      endTime: '19:00',
      description: '헬스장 운동',
      location: '헬스장',
      category: '개인',
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      // 리스트가 로드될 때까지 대기
      await eventList.waitFor({ state: 'attached', timeout: 5000 });
      const meetingEvent = eventList.getByText('회의').first();
      const isVisible = await meetingEvent.isVisible({ timeout: 2000 });
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });

    // 제목으로 검색 (READ)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('회의');

    // 검색 결과 조회 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const meetingEvent = eventList.getByText('회의').first();
      const isVisible = await meetingEvent.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
      // 운동 이벤트는 보이지 않아야 함
      const exerciseEvent = eventList.getByText('운동');
      const isExerciseVisible = await exerciseEvent.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isExerciseVisible).toBe(false);
    }).toPass({ timeout: 10000, intervals: [500] });

    // 설명으로 검색 (READ)
    await searchInput.fill('중요한');

    // 설명으로 검색된 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const meetingEvent = eventList.getByText('회의').first();
      const isVisible = await meetingEvent.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });

    // 위치로 검색 (READ)
    await searchInput.fill('회의실');

    // 위치로 검색된 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const meetingEvent = eventList.getByText('회의').first();
      const isVisible = await meetingEvent.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });
  });

  test('검색어를 변경하여 결과를 업데이트할 수 있다 (UPDATE)', async ({ page }) => {
    const today = getTodayDate();

    // 다양한 이벤트 생성
    await createEvent(page, {
      title: '팀 회의',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
    });

    await createEvent(page, {
      title: '프로젝트 회의',
      date: today,
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황',
      location: '회의실 B',
      category: '업무',
    });

    await createEvent(page, {
      title: '점심',
      date: today,
      startTime: '12:00',
      endTime: '13:00',
      description: '점심 식사',
      location: '식당',
      category: '개인',
    });

    // 이벤트가 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      const count = await eventList
        .locator('div')
        .filter({ hasText: /팀 회의|프로젝트 회의|점심/ })
        .count();
      expect(count).toBeGreaterThanOrEqual(3);
    }).toPass({ timeout: 10000 });

    const searchInput = page.getByPlaceholder('검색어를 입력하세요');

    // 첫 번째 검색어로 필터링
    // '팀'만 검색하여 '팀 회의'만 필터링 (부분 일치 검색이므로 '회의'로 검색하면 둘 다 나타남)
    await searchInput.fill('팀');

    // 첫 번째 검색 결과 확인
    // '팀'을 검색하면 '팀 회의'만 보이고 '프로젝트 회의'는 보이지 않아야 함
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(500);

      // '팀 회의'가 보이는지 확인
      const teamMeeting = eventList.getByText('팀 회의').first();
      const isTeamVisible = await teamMeeting.isVisible({ timeout: 2000 }).catch(() => false);
      if (!isTeamVisible) {
        throw new Error('팀 회의가 보이지 않습니다');
      }

      // '프로젝트 회의'가 보이지 않는지 확인
      const projectMeetingCount = await eventList.getByText('프로젝트 회의').count();
      if (projectMeetingCount > 0) {
        // 요소가 있더라도 보이지 않아야 함
        const projectMeeting = eventList.getByText('프로젝트 회의').first();
        const isProjectVisible = await projectMeeting
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        if (isProjectVisible) {
          throw new Error('프로젝트 회의가 보입니다');
        }
      }

      expect(isTeamVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });

    // 검색어 변경 (UPDATE)
    await searchInput.fill('프로젝트');

    // 업데이트된 검색 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const projectMeeting = eventList.getByText('프로젝트 회의').first();
      const isProjectVisible = await projectMeeting.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isProjectVisible).toBe(true);
      const teamMeeting = eventList.getByText('팀 회의');
      const isTeamVisible = await teamMeeting.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isTeamVisible).toBe(false);
    }).toPass({ timeout: 10000, intervals: [500] });

    // 검색어를 더 구체적으로 변경
    await searchInput.fill('점심');

    // 다시 업데이트된 검색 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const lunch = eventList.getByText('점심').first();
      const isLunchVisible = await lunch.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isLunchVisible).toBe(true);
      const teamMeeting = eventList.getByText('팀 회의');
      const isTeamVisible = await teamMeeting.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isTeamVisible).toBe(false);
    }).toPass({ timeout: 10000, intervals: [500] });
  });

  test('검색어를 삭제하여 전체 결과를 복원할 수 있다 (DELETE)', async ({ page }) => {
    const today = getTodayDate();

    // 여러 이벤트 생성
    await createEvent(page, {
      title: '회의',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: '중요한 회의',
      location: '회의실',
      category: '업무',
    });

    await createEvent(page, {
      title: '운동',
      date: today,
      startTime: '18:00',
      endTime: '19:00',
      description: '헬스장 운동',
      location: '헬스장',
      category: '개인',
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      // 리스트가 로드될 때까지 대기
      await eventList.waitFor({ state: 'attached', timeout: 5000 });
      const meetingEvent = eventList.getByText('회의').first();
      const isVisible = await meetingEvent.isVisible({ timeout: 2000 });
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });

    const searchInput = page.getByPlaceholder('검색어를 입력하세요');

    // 검색어 입력
    await searchInput.fill('회의');

    // 필터링된 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const meetingEvent = eventList.getByText('회의').first();
      const isVisible = await meetingEvent.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
      const exerciseEvent = eventList.getByText('운동');
      const isExerciseVisible = await exerciseEvent.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isExerciseVisible).toBe(false);
    }).toPass({ timeout: 10000, intervals: [500] });

    // 검색어 삭제 (DELETE)
    await searchInput.clear();

    // 전체 결과가 복원되었는지 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const meetingEvent = eventList.getByText('회의').first();
      const isMeetingVisible = await meetingEvent.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isMeetingVisible).toBe(true);
      const exerciseEvent = eventList.getByText('운동').first();
      const isExerciseVisible = await exerciseEvent.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isExerciseVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });
  });

  test('검색 결과가 없을 때 적절한 메시지가 표시되어야 한다', async ({ page }) => {
    const today = getTodayDate();

    // 이벤트 생성
    await createEvent(page, {
      title: '회의',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: '중요한 회의',
      location: '회의실',
      category: '업무',
    });

    // 이벤트가 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      const meetingEvent = eventList.getByText('회의').first();
      await expect(meetingEvent).toBeVisible();
    }).toPass({ timeout: 10000 });

    // 존재하지 않는 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('존재하지 않는 일정');

    // "검색 결과가 없습니다." 메시지 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const noResultsMessage = eventList.getByText('검색 결과가 없습니다.');
      const isVisible = await noResultsMessage.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });
  });

  test('대소문자 구분 없이 검색이 가능해야 한다', async ({ page }) => {
    const today = getTodayDate();

    // 이벤트 생성
    await createEvent(page, {
      title: 'Team Meeting',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: 'Team discussion',
      location: 'Conference Room',
      category: '업무',
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      // 리스트가 로드될 때까지 대기
      await eventList.waitFor({ state: 'attached', timeout: 5000 });
      const teamMeeting = eventList.getByText('Team Meeting').first();
      const isVisible = await teamMeeting.isVisible({ timeout: 2000 });
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });

    const searchInput = page.getByPlaceholder('검색어를 입력하세요');

    // 소문자로 검색
    await searchInput.fill('team');

    // 검색 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const teamMeeting = eventList.getByText('Team Meeting').first();
      const isVisible = await teamMeeting.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });

    // 대문자로 검색
    await searchInput.fill('TEAM');

    // 검색 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const teamMeeting = eventList.getByText('Team Meeting').first();
      const isVisible = await teamMeeting.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });
  });

  test('부분 일치 검색이 가능해야 한다', async ({ page }) => {
    const today = getTodayDate();

    // 이벤트 생성
    await createEvent(page, {
      title: '프로젝트 회의',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실',
      category: '업무',
    });

    // 이벤트가 생성되었는지 확인 (재시도 로직 포함)
    const eventList = page.getByTestId('event-list');
    await expect(async () => {
      // 리스트가 로드될 때까지 대기
      await eventList.waitFor({ state: 'attached', timeout: 5000 });
      const projectMeeting = eventList.getByText('프로젝트 회의').first();
      const isVisible = await projectMeeting.isVisible({ timeout: 2000 });
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 15000, intervals: [500] });

    const searchInput = page.getByPlaceholder('검색어를 입력하세요');

    // 부분 일치 검색
    await searchInput.fill('프로젝트');

    // 검색 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const projectMeeting = eventList.getByText('프로젝트 회의').first();
      const isVisible = await projectMeeting.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });

    // 다른 부분 일치 검색
    await searchInput.fill('회의');

    // 검색 결과 확인
    await expect(async () => {
      // 검색 결과가 업데이트될 때까지 대기
      await page.waitForTimeout(300);
      const projectMeeting = eventList.getByText('프로젝트 회의').first();
      const isVisible = await projectMeeting.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass({ timeout: 10000, intervals: [500] });
  });
});
