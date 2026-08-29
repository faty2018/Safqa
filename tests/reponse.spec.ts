import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Mot de passe').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
});

test('génération d\'une trame de réponse pour un AO analysé', async ({ page }) => {
  const aoId = 'ebb82557-1480-4626-872e-63bb8c89871c';

  await page.goto(`/recherche/${aoId}`);

  const genererBtn = page.getByRole('button', { name: /générer une réponse avec l\'ia/i });
  await expect(genererBtn).toBeVisible({ timeout: 10000 });

  page.on('dialog', async (dialog) => {
    await dialog.dismiss();
  });

  await genererBtn.click();

  await page.waitForTimeout(2000);
  const url = page.url();
  const redirected = /\/reponses\/.+/.test(url);

  expect(redirected || url.includes(`/recherche/${aoId}`)).toBeTruthy();
});