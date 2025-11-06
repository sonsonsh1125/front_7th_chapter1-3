# Chromatic 실행 오류 해결 가이드

## 1. "Missing project token" 오류

### 증상
```
✖ Missing project token
```

### 해결 방법

**로컬에서 실행할 때:**
```bash
# 환경 변수 설정
export CHROMATIC_PROJECT_TOKEN=your-project-token-here

# Chromatic 실행
pnpm chromatic
```

**토큰을 받는 방법:**
1. [Chromatic](https://www.chromatic.com/)에 로그인
2. 프로젝트 선택 또는 새 프로젝트 생성
3. Settings → Project token 복사

## 2. Storybook 빌드 오류

### 증상
```
Error: Storybook build failed
```

### 해결 방법

1. **로컬에서 빌드 테스트:**
```bash
pnpm build-storybook
```

2. **Storybook 개발 서버로 확인:**
```bash
pnpm storybook
```

3. **의존성 재설치:**
```bash
rm -rf node_modules
pnpm install
```

## 3. TypeScript 오류

### 증상
```
Type error: ...
```

### 해결 방법

1. **타입 체크:**
```bash
pnpm lint:tsc
```

2. **린터 오류 확인:**
```bash
pnpm lint
```

## 4. 스토리 파일 오류

### 증상
```
Error: Cannot find module...
```

### 해결 방법

1. **스토리 파일 경로 확인:**
   - 파일이 `src/**/*.stories.tsx` 패턴에 맞는지 확인
   - `.storybook/main.ts`의 `stories` 설정 확인

2. **임포트 경로 확인:**
   - 상대 경로가 올바른지 확인
   - 타입 임포트가 올바른지 확인

## 5. Chromatic 업로드 실패

### 증상
```
Error: Failed to upload build
```

### 해결 방법

1. **인터넷 연결 확인**
2. **Chromatic 서비스 상태 확인**: https://status.chromatic.com/
3. **방화벽/프록시 설정 확인**
4. **재시도:**
```bash
pnpm chromatic
```

## 6. CI/CD에서 오류

### 증상
GitHub Actions에서 Chromatic 실행 실패

### 해결 방법

1. **GitHub Secrets 확인:**
   - Settings → Secrets and variables → Actions
   - `CHROMATIC_PROJECT_TOKEN`이 설정되어 있는지 확인

2. **워크플로우 파일 확인:**
   - `.github/workflows/ci.yml` 파일 확인
   - Chromatic 작업이 올바르게 설정되어 있는지 확인

## 7. 일반적인 디버깅 방법

### 1. 로그 확인
```bash
# 상세 로그와 함께 실행
pnpm chromatic --debug
```

### 2. Storybook 수동 빌드
```bash
# Storybook 빌드
pnpm build-storybook

# 빌드 결과 확인
ls -la storybook-static/
```

### 3. 의존성 확인
```bash
# 패키지 버전 확인
pnpm list chromatic
pnpm list storybook
```

### 4. 캐시 클리어
```bash
# Storybook 캐시 삭제
rm -rf storybook-static
rm -rf node_modules/.cache

# 재빌드
pnpm build-storybook
```

## 8. 자주 발생하는 문제

### 문제: 스토리가 보이지 않음

**원인:** 스토리 파일이 올바른 위치에 없거나, 파일명이 잘못됨

**해결:**
- 파일명이 `*.stories.tsx`로 끝나는지 확인
- 파일이 `src/` 디렉토리 내에 있는지 확인
- `.storybook/main.ts`의 `stories` 패턴 확인

### 문제: 컴포넌트가 렌더링되지 않음

**원인:** 의존성 누락 또는 임포트 오류

**해결:**
- 컴포넌트의 모든 의존성이 설치되어 있는지 확인
- 임포트 경로가 올바른지 확인
- 브라우저 콘솔에서 오류 확인

### 문제: 스타일이 적용되지 않음

**원인:** Material-UI 테마 또는 스타일 설정 문제

**해결:**
- `.storybook/preview.tsx`에서 ThemeProvider 확인
- CssBaseline이 포함되어 있는지 확인

## 9. 도움 받기

문제가 해결되지 않으면:

1. **Chromatic 문서**: https://www.chromatic.com/docs
2. **Storybook 문서**: https://storybook.js.org/docs
3. **오류 메시지 전체 복사**하여 검색
4. **GitHub Issues** 확인

## 10. 체크리스트

Chromatic 실행 전 확인사항:

- [ ] Chromatic 프로젝트 토큰 설정됨
- [ ] Storybook 빌드 성공 (`pnpm build-storybook`)
- [ ] Storybook 개발 서버 정상 작동 (`pnpm storybook`)
- [ ] 모든 스토리 파일이 올바른 위치에 있음
- [ ] TypeScript 오류 없음 (`pnpm lint:tsc`)
- [ ] 린터 오류 없음 (`pnpm lint`)
- [ ] 의존성 설치 완료 (`pnpm install`)

