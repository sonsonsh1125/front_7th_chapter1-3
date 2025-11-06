# 과제 3

### 필수 스펙

- 드래그 앤 드롭(D&D) 기능 개발
  - [ ] 캘린더의 일정을 마우스로 끌어 다른 날짜나 시간으로 옮기는 기능을 구현합니다.
- 날짜 클릭으로 일정 생성 기능 개발
  - [ ] 캘린더의 비어있는 날짜 셀을 클릭하면, 해당 날짜가 자동으로 폼에 채워지도록 하세요.

## 기본 과제

### 기본과제 제출

- 아래 작성된 E2E 테스트 작성은 필수입니다. 추가로 작성하고 싶다면 작성해주세요.
- 여기서 말하는 전반은 Create, Read, Update, Delete 모두에 해당합니다.

1. [ ] 기본 일정 관리 워크플로우 전반을 검증하세요.
2. [ ] 반복 일정 관리 워크플로우 전반을 검증하세요.
3. [ ] 일정 겹침 처리 방식에 대해 검증하세요.
4. [ ] 알림 시스템 관련 노출 조건에 대해 검증하세요.
5. [ ] 검색 및 필터링 전반에 대해 검증하세요.

### 심화과제

- 아래 시각적 회귀 테스트는 필수 입니다. 추가로 작성하고 싶다면 작성해주세요.

1. [ ] 타입에 따른 캘린더 뷰 렌더링
2. [ ] 일정 상태별 시각적 표현
3. [ ] 다이얼로그 및 모달
4. [ ] 폼 컨트롤 상태
5. [ ] 각 셀 텍스트 길이에 따른 처리

## Storybook 및 Chromatic 설정

이 프로젝트는 시각적 회귀 테스트를 위해 Storybook과 Chromatic을 사용합니다.

### Storybook 실행

```bash
# Storybook 개발 서버 실행
pnpm storybook

# Storybook 빌드
pnpm build-storybook
```

### Chromatic 설정 및 실행

#### 1. Chromatic 프로젝트 생성

1. [Chromatic](https://www.chromatic.com/)에 가입/로그인
2. GitHub 저장소와 연결
3. 새 프로젝트 생성
4. 프로젝트 토큰 복사

#### 2. 프로젝트 토큰 설정

**로컬에서 실행할 때:**

```bash
# 환경 변수로 설정
export CHROMATIC_PROJECT_TOKEN=your-project-token-here

# 또는 한 줄로 실행
CHROMATIC_PROJECT_TOKEN=your-project-token-here pnpm chromatic
```

**CI/CD에서 실행할 때:**

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `CHROMATIC_PROJECT_TOKEN`
4. Value: Chromatic 프로젝트 토큰
5. "Add secret" 클릭

#### 3. Chromatic 실행

```bash
# Chromatic에 스토리 업로드 (시각적 회귀 테스트)
pnpm chromatic
```

이 명령어는:
1. Storybook을 빌드합니다
2. 모든 스토리의 스크린샷을 캡처합니다
3. Chromatic 서버에 업로드합니다
4. 이전 버전과 비교하여 변경사항을 감지합니다

#### 4. Chromatic 대시보드 확인

1. [Chromatic 대시보드](https://www.chromatic.com/builds) 접속
2. 프로젝트 선택
3. 빌드 결과 확인:
   - ✅ 변경사항 없음 (No changes)
   - ⚠️ 변경사항 있음 (Visual changes detected)
   - ❌ 오류 발생

#### 5. 변경사항 검토

변경사항이 감지된 경우:
- **의도한 변경**: Chromatic 대시보드에서 "Accept" 클릭
- **의도하지 않은 변경**: "Deny" 클릭하고 코드 수정

### CI/CD 통합

GitHub Actions 워크플로우에 Chromatic 작업이 포함되어 있습니다. PR이 생성되거나 업데이트될 때마다 자동으로 실행됩니다.

자세한 설정 방법은 [CHROMATIC_SETUP.md](./CHROMATIC_SETUP.md)를 참고하세요.

### 스토리 작성 가이드

새로운 컴포넌트에 대한 스토리를 작성하려면:

1. 컴포넌트 파일과 같은 디렉토리에 `ComponentName.stories.tsx` 파일을 생성합니다.
2. 다양한 상태와 변형을 보여주는 스토리를 작성합니다.
3. `pnpm storybook`으로 로컬에서 확인합니다.
4. `pnpm chromatic`으로 시각적 회귀 테스트를 실행합니다.

### 작성된 스토리

- **Components/RecurringEventDialog**: 반복 일정 다이얼로그
- **Components/OverlapDialog**: 일정 겹침 경고 다이얼로그
- **Calendar/CalendarView**: 캘린더 뷰 (Week/Month)
  - 빈 캘린더
  - 기본 일정
  - 알림이 있는 일정
  - 반복 일정
  - 많은 일정
  - 공휴일 표시
