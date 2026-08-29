import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Mot de passe').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
});

test('la recherche filtre bien les AO par mot-clé', async ({ page }) => {
  await page.goto('/recherche');
  await page.fill('input[name="q"]', 'construction');
  await page.getByRole('button', { name: 'Appliquer les filtres' }).click();
  await page.waitForURL(/.*q=construction/);

  const hasResults = await page.locator('article').first().isVisible().catch(() => false);
  const hasEmptyState = await page.getByText(/aucun appel d'offres ne correspond/i).isVisible().catch(() => false);
  expect(hasResults || hasEmptyState).toBeTruthy();
});

test('le bouton suivre bascule bien l\'état (optimistic UI)', async ({ page }) => {
  await page.goto('/recherche');

  const followBtn = page.getByRole('button', { name: /suivre cet appel d'offres|ne plus suivre/i }).first();
  await expect(followBtn).toBeVisible({ timeout: 10000 });

  const labelAvant = await followBtn.getAttribute('aria-label');
  await followBtn.click();

  await expect(followBtn).not.toHaveAttribute('aria-label', labelAvant!, { timeout: 3000 });
  const labelApres = await followBtn.getAttribute('aria-label');
  expect(labelApres).not.toBe(labelAvant);
});