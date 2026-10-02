import { defineConfig } from '@playwright/test'

// Génération des images de la doc (npm run captures), sur les émulateurs Firebase.
export default defineConfig({
  testDir: 'scripts/captures',
  timeout: 180_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5175', deviceScaleFactor: 2, browserName: 'chromium' },
  webServer: {
    command: 'npx vite --mode emulateurs --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: false,
  },
})
