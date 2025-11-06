# Chromatic 시각적 회귀 테스트 가이드

## Chromatic이란?

Chromatic은 Storybook의 모든 스토리를 자동으로 스크린샷 캡처하고, 이전 버전과 비교하여 시각적 변경사항을 감지하는 도구입니다.

## 실행 방법

### 1. 프로젝트 토큰 설정 (최초 1회)

```bash
# 환경 변수로 설정
export CHROMATIC_PROJECT_TOKEN=your-project-token-here
```

**토큰 받는 방법:**
1. [Chromatic](https://www.chromatic.com/) 접속 및 로그인
2. GitHub 저장소와 연결
3. 새 프로젝트 생성
4. Settings → Project token 복사

### 2. Chromatic 실행

```bash
pnpm chromatic
```

이 명령어는 자동으로:
1. ✅ Storybook 빌드 (`pnpm build-storybook` 자동 실행)
2. ✅ 모든 스토리의 스크린샷 캡처
3. ✅ Chromatic 서버에 업로드
4. ✅ 이전 버전과 비교하여 변경사항 감지

### 3. 실행 결과 확인

#### 터미널 출력 예시

```
✓ Storybook built
✓ Captured 15 stories across 3 components
✓ Uploaded build to Chromatic
✓ No visual changes detected
```

또는 변경사항이 있는 경우:

```
⚠ Visual changes detected
  → View changes: https://www.chromatic.com/build?appId=...
```

#### Chromatic 대시보드 확인

1. [Chromatic 대시보드](https://www.chromatic.com/builds) 접속
2. 프로젝트 선택
3. 최신 빌드 확인:
   - **✅ No changes**: 변경사항 없음 (성공)
   - **⚠️ Changes**: 변경사항 감지됨 (검토 필요)
   - **❌ Failed**: 오류 발생

## 작성된 스토리 목록

현재 작성된 스토리들은 Chromatic에서 자동으로 테스트됩니다:

### Components
- **RecurringEventDialog** (5개 스토리)
  - EditMode, DeleteMode, MoveMode, Closed, WithoutEvent

- **OverlapDialog** (3개 스토리)
  - SingleOverlap, MultipleOverlaps, Closed

### Calendar
- **CalendarView** (13개 스토리)
  - WeekViewEmpty, WeekViewBasic, WeekViewWithNotifications
  - WeekViewWithRepeating, WeekViewManyEvents
  - MonthViewEmpty, MonthViewBasic, MonthViewWithNotifications
  - MonthViewWithRepeating, MonthViewManyEvents
  - MonthViewWithHolidays, MonthViewFebruary, MonthViewDecember

### Event States
- **Visual Representation** (12개 스토리)
  - NormalEvent, NotifiedEvent, RepeatingEvent
  - NotifiedAndRepeatingEvent, DraggingEvent
  - LongTitleEvent, LongTitleNotifiedEvent
  - WeeklyRepeatingEvent, MonthlyRepeatingEvent, YearlyRepeatingEvent
  - AllStatesComparison, MultipleEventsInCell

**총 33개 스토리**가 Chromatic에서 자동으로 테스트됩니다!

## 변경사항 검토

### 변경사항이 감지된 경우

1. **Chromatic 대시보드 접속**
   - 빌드 링크 클릭 또는 대시보드에서 빌드 선택

2. **변경사항 확인**
   - Before: 이전 버전 스크린샷
   - After: 현재 버전 스크린샷
   - Diff: 변경된 부분 하이라이트

3. **검토 및 승인**
   - **✅ Accept**: 의도한 변경이면 승인 (새로운 baseline으로 설정)
   - **❌ Deny**: 의도하지 않은 변경이면 거부 (코드 수정 필요)

### 변경사항 승인/거부 방법

1. Chromatic 대시보드에서 변경사항이 있는 스토리 클릭
2. 스크린샷 비교 화면에서:
   - **"Accept"** 버튼: 변경사항 승인
   - **"Deny"** 버튼: 변경사항 거부
3. 모든 변경사항을 검토한 후 빌드 승인/거부

## CI/CD에서 자동 실행

GitHub Actions에서 PR이 생성되거나 업데이트될 때마다 자동으로 Chromatic이 실행됩니다.

### GitHub Secrets 설정

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `CHROMATIC_PROJECT_TOKEN`
4. Value: Chromatic 프로젝트 토큰
5. "Add secret" 클릭

### 자동 실행 확인

PR이 생성되면:
- GitHub Actions에서 `chromatic` 작업 실행
- Chromatic 대시보드에 빌드 생성
- 변경사항이 있으면 PR에 코멘트 추가

## 테스트 시나리오

### 1. 타입에 따른 캘린더 뷰 렌더링
- ✅ Week View (5개 스토리)
- ✅ Month View (8개 스토리)

### 2. 일정 상태별 시각적 표현
- ✅ 일반 일정
- ✅ 알림이 있는 일정
- ✅ 반복 일정
- ✅ 알림 + 반복 일정
- ✅ 드래그 중인 일정
- ✅ 긴 제목 일정

### 3. 다이얼로그 및 모달
- ✅ RecurringEventDialog (5개 모드)
- ✅ OverlapDialog (3개 상태)

### 4. 폼 컨트롤 상태
- (추가 작성 가능)

### 5. 각 셀 텍스트 길이에 따른 처리
- ✅ LongTitleEvent
- ✅ LongTitleNotifiedEvent

## 트러블슈팅

### 토큰 오류
```
Error: Missing project token
```
**해결**: 환경 변수에 `CHROMATIC_PROJECT_TOKEN` 설정

### 빌드 실패
```
Error: Storybook build failed
```
**해결**: `pnpm build-storybook`로 로컬에서 빌드 테스트

### 업로드 실패
```
Error: Failed to upload build
```
**해결**: 인터넷 연결 확인, Chromatic 서비스 상태 확인

자세한 내용은 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)를 참고하세요.

