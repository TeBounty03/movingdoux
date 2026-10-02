import { defineConfig } from 'vitest/config'

// Tests des règles de sécurité Firestore, contre l'émulateur : `npm run test:rules`
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.js'],
    testTimeout: 20_000,
    fileParallelism: false,
  },
})
