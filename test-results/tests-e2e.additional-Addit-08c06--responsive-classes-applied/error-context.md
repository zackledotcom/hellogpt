# Test info

- Name: Additional E2E tests >> should verify Tailwind responsive classes applied
- Location: /Users/jibbr/Desktop/hellogpt/tests/e2e.additional.spec.ts:21:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

    at /Users/jibbr/Desktop/hellogpt/tests/e2e.additional.spec.ts:22:16
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Additional E2E tests', () => {
   4 |   test('should open main page and check title', async ({ page }) => {
   5 |     await page.goto('http://localhost:3000'); // Adjust URL as needed
   6 |     await expect(page).toHaveTitle(/HelloGPT|App/i);
   7 |   });
   8 |
   9 |   test('should navigate through main UI components', async ({ page }) => {
  10 |     await page.goto('http://localhost:3000');
  11 |     // Example: check navigation links or buttons
  12 |     const navLinks = page.locator('nav a');
  13 |     const count = await navLinks.count();
  14 |     expect(count).toBeGreaterThan(0);
  15 |
  16 |     // Click first nav link and verify URL change
  17 |     await navLinks.first().click();
  18 |     await expect(page).not.toHaveURL('http://localhost:3000');
  19 |   });
  20 |
  21 |   test('should verify Tailwind responsive classes applied', async ({ page }) => {
> 22 |     await page.goto('http://localhost:3000');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  23 |     // Check for presence of Tailwind classes on main container
  24 |     const mainContainer = page.locator('div[class*="flex"]');
  25 |     await expect(mainContainer).toBeVisible();
  26 |   });
  27 | });
  28 |
```