import { expect, test } from '@playwright/test'

async function gotoApp(page: import('@playwright/test').Page) {
	await page.goto('/')
	await page.waitForLoadState('domcontentloaded')
	await page.waitForTimeout(300)
}

test.describe('Visual Regression - Phase 4 Migration', () => {
	test.beforeEach(async ({ page }) => {
		page.on('requestfailed', () => {})
	})

	test('Auth - login page (light)', async ({ page }) => {
		await gotoApp(page)
		await expect(page).toHaveScreenshot('auth-login-light.png', {
			fullPage: true,
			maxDiffPixelRatio: 0.02,
		})
	})

	test('Sidebar shell - default state (light)', async ({ page }) => {
		await gotoApp(page)
		const sidebar = page.locator('[data-testid="sidebar"]').first()
		test.skip((await sidebar.count()) === 0, 'Sidebar not available in current auth state.')
		await expect(sidebar).toHaveScreenshot('sidebar-shell-light.png', {
			maxDiffPixelRatio: 0.02,
		})
	})

	test('Chat view - shell layout (light)', async ({ page }) => {
		await gotoApp(page)
		const sidebar = page.locator('[data-testid="sidebar"]').first()
		test.skip((await sidebar.count()) === 0, 'Shell layout requires authenticated app state.')
		await expect(page).toHaveScreenshot('chat-shell-light.png', {
			clip: { x: 0, y: 0, width: 1280, height: 800 },
			maxDiffPixelRatio: 0.02,
		})
	})

	test('Settings surface (light)', async ({ page }) => {
		await gotoApp(page)
		const settingsButton = page.getByRole('button', { name: /settings/i }).first()
		test.skip((await settingsButton.count()) === 0, 'Settings trigger not available in current state.')
		await settingsButton.click()
		await page.waitForTimeout(200)
		await expect(page).toHaveScreenshot('settings-surface-light.png', {
			fullPage: true,
			maxDiffPixelRatio: 0.02,
		})
	})

	test('Dialog component - open state (light)', async ({ page }) => {
		await gotoApp(page)
		const trigger = page.locator('[data-testid="dialog-trigger"]').first()
		test.skip((await trigger.count()) === 0, 'Dialog trigger not present on the current page.')
		await trigger.click()
		await page.waitForTimeout(200)
		await expect(page.locator('[role="dialog"]').first()).toHaveScreenshot('dialog-open-light.png', {
			maxDiffPixelRatio: 0.02,
		})
	})

	test('Dark mode - root surface', async ({ page }) => {
		await gotoApp(page)
		await page.evaluate(() => {
			document.documentElement.classList.add('dark')
			localStorage.setItem('theme', 'dark')
		})
		await page.reload()
		await page.waitForLoadState('domcontentloaded')
		await page.waitForTimeout(300)
		await expect(page).toHaveScreenshot('root-dark.png', {
			fullPage: true,
			maxDiffPixelRatio: 0.02,
		})
	})
})