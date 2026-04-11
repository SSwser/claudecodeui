import { expect, test } from '@playwright/test';

const scenes = ['landing', 'auth', 'tabs', 'dialog', 'chat', 'settings', 'upgrade'] as const;
const themes = ['light', 'dark'] as const;

async function gotoFixture(
  page: import('@playwright/test').Page,
  scene: (typeof scenes)[number],
  theme: (typeof themes)[number]
) {
  await page.addInitScript((nextTheme: string) => {
    window.localStorage.setItem('theme', nextTheme);
  }, theme);
  await page.goto(`/__visual/design-md?scene=${scene}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-visual-ready="true"]');
}

test.describe('Visual Regression - Phase 999.2 Design Fixture', () => {
  for (const theme of themes) {
    for (const scene of scenes) {
      test(`${scene} (${theme})`, async ({ page }) => {
        await gotoFixture(page, scene, theme);
        await expect(page).toHaveScreenshot(`design-md-${scene}-${theme}.png`, {
          fullPage: true,
        });
      });
    }
  }

  test('fixture route index is discoverable', async ({ page }) => {
    await page.goto('/__visual/design-md');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Visual regression scene matrix')).toBeVisible();
  });
});
