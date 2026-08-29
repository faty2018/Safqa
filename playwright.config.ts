// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';
config({ path: '.env.test' });

export default defineConfig({
    workers: 1,
    testDir: './tests',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
    },
});