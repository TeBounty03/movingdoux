import { defineConfig, devices } from '@playwright/test'

// Lancé via `npm run test:e2e`, qui démarre d'abord les émulateurs Firebase.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Petit écran (320 px de large) : le cas le plus contraignant
    { name: 'petit-mobile', use: { ...devices['iPhone SE'], defaultBrowserType: 'chromium', browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npx vite --mode emulateurs --port 5174 --strictPort',
    url: 'http://localhost:5174',
    // Jamais de réutilisation : un `npm run dev` déjà lancé sur ce port parlerait à la vraie base
    reuseExistingServer: false,
  },
})
