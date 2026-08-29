import { test, expect } from '@playwright/test';

test('un utilisateur peut se connecter et accède à son dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Mot de passe').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // attend la stabilisation complète (gère les redirections en cascade dashboard <-> login)
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  console.log('[URL APRÈS STABILISATION]', page.url());

  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
});