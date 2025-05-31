import { test, expect } from '@playwright/test';

test.describe('Additional E2E tests', () => {
  test('should open main page and check title', async ({ page }) => {
    await page.goto('http://localhost:3000'); // Adjust URL as needed
    await expect(page).toHaveTitle(/HelloGPT|App/i);
  });

  test('should navigate through main UI components', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Example: check navigation links or buttons
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Click first nav link and verify URL change
    await navLinks.first().click();
    await expect(page).not.toHaveURL('http://localhost:3000');
  });

  test('should verify Tailwind responsive classes applied', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Check for presence of Tailwind classes on main container
    const mainContainer = page.locator('div[class*="flex"]');
    await expect(mainContainer).toBeVisible();
  });
});
