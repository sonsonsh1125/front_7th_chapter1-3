# Chromatic 설정 가이드

## 1. Chromatic 프로젝트 생성

1. [Chromatic](https://www.chromatic.com/)에 가입/로그인
2. GitHub 저장소와 연결
3. 새 프로젝트 생성
4. 프로젝트 토큰 복사

## 2. 프로젝트 토큰 설정

### 방법 1: 환경 변수 사용 (권장)

```bash
# 로컬에서 실행할 때
export CHROMATIC_PROJECT_TOKEN=your-project-token-here
pnpm chromatic

# 또는 한 줄로
CHROMATIC_PROJECT_TOKEN=your-project-token-here pnpm chromatic
```

### 방법 2: 설정 파일 사용

`.chromatic.config.json` 파일의 `projectToken` 필드에 토큰을 입력:

```json
{
  "projectToken": "your-project-token-here",
  "buildScriptName": "build-storybook",
  "exitZeroOnChanges": true,
  "exitOnceUploaded": true,
  "zip": true
}
```

**주의**: 설정 파일에 토큰을 저장하면 Git에 커밋되지 않도록 `.gitignore`에 추가하세요.

## 3. 로컬에서 Chromatic 실행

### 기본 실행

```bash
pnpm chromatic
```

### 옵션 설명

- `--exit-zero-on-changes`: 변경사항이 있어도 exit code 0으로 종료 (이미 설정됨)
- `--exit-once-uploaded`: 업로드 후 즉시 종료 (이미 설정됨)
- `--zip`: 빌드 결과를 압축하여 업로드 (이미 설정됨)

### Storybook 빌드 후 Chromatic 실행

```bash
# 1. Storybook 빌드
pnpm build-storybook

# 2. Chromatic 실행
pnpm chromatic
```

## 4. CI/CD 통합 (GitHub Actions)

`.github/workflows/ci.yml`에 Chromatic 작업이 추가되어 있습니다.

### GitHub Secrets 설정

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `CHROMATIC_PROJECT_TOKEN`
4. Value: Chromatic 프로젝트 토큰
5. "Add secret" 클릭

### 자동 실행

PR이 생성되거나 업데이트될 때마다 자동으로 Chromatic이 실행됩니다.

## 5. Chromatic 대시보드 확인

1. [Chromatic 대시보드](https://www.chromatic.com/builds) 접속
2. 프로젝트 선택
3. 빌드 결과 확인:
   - ✅ 변경사항 없음 (No changes)
   - ⚠️ 변경사항 있음 (Visual changes detected)
   - ❌ 오류 발생

## 6. 변경사항 검토

### 변경사항이 감지된 경우

1. Chromatic 대시보드에서 변경사항 확인
2. 스크린샷 비교:
   - Baseline: 이전 버전
   - Changed: 현재 버전
3. 변경사항 검토:
   - ✅ 의도한 변경: "Accept" 클릭
   - ❌ 의도하지 않은 변경: "Deny" 클릭하고 코드 수정

### 변경사항 승인/거부

- **승인**: 새로운 baseline으로 설정
- **거부**: PR에 코멘트가 추가되고, 빌드가 실패로 표시됨

## 7. 트러블슈팅

### 토큰 오류

```
Error: Missing project token. Set CHROMATIC_PROJECT_TOKEN
```

**해결**: 환경 변수 또는 설정 파일에 토큰 설정

### 빌드 실패

```
Error: Storybook build failed
```

**해결**: 
1. `pnpm build-storybook`로 로컬에서 빌드 테스트
2. Storybook 설정 확인 (`.storybook/main.ts`)

### 네트워크 오류

```
Error: Failed to upload build
```

**해결**:
1. 인터넷 연결 확인
2. Chromatic 서비스 상태 확인
3. 방화벽/프록시 설정 확인

## 8. 고급 설정

### 특정 브랜치만 실행

`.chromatic.config.json`에 추가:

```json
{
  "onlyChanged": true,
  "untraced": ["**/*.md", "**/*.test.*"]
}
```

### 커스텀 빌드 디렉토리

```json
{
  "buildDir": "storybook-static"
}
```

## 9. 참고 자료

- [Chromatic 공식 문서](https://www.chromatic.com/docs)
- [Storybook 문서](https://storybook.js.org/docs)
- [시각적 회귀 테스트 가이드](https://www.chromatic.com/docs/visual-testing)

