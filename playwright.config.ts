import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 테스트를 위한 Playwright 설정
 *
 * 서버 설정:
 * - Express API 서버: http://localhost:3000
 * - Vite 개발 서버: http://localhost:5173 (기본 포트)
 */
export default defineConfig({
  testDir: './e2e',

  /* 테스트 실행 옵션 */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* 테스트 보고서 설정 */
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  /* 공유 설정 */
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* 프로젝트별 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 개발 서버 실행 설정 */
  webServer: [
    {
      command: 'TEST_ENV=e2e pnpm run server',
      url: 'http://localhost:3000/api/events',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm run start',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
