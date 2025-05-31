# Test info

- Name: Extended E2E tests >> should handle invalid chat input gracefully
- Location: /Users/jibbr/Desktop/hellogpt/tests/e2e.extended.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

    at /Users/jibbr/Desktop/hellogpt/tests/e2e.extended.spec.ts:5:16
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Extended E2E tests', () => {
   4 |   test('should handle invalid chat input gracefully', async ({ page }) => {
>  5 |     await page.goto('http://localhost:3000');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
   6 |     const input = page.locator('input[placeholder="Type your message..."]');
   7 |     const sendButton = page.locator('button:has-text("Send")');
   8 |
   9 |     await input.fill('');
  10 |     await sendButton.click();
  11 |
  12 |     // Expect some validation error or no response
  13 |     const errorMessage = page.locator('text=Please enter a message');
  14 |     await expect(errorMessage).toBeVisible();
  15 |   });
  16 |
  17 |   test('should maintain chat history after reload', async ({ page }) => {
  18 |     await page.goto('http://localhost:3000');
  19 |     const input = page.locator('input[placeholder="Type your message..."]');
  20 |     const sendButton = page.locator('button:has-text("Send")');
  21 |
  22 |     await input.fill('Test message');
  23 |     await sendButton.click();
  24 |
  25 |     // Wait for response
  26 |     await page.waitForTimeout(2000);
  27 |
  28 |     // Reload page
  29 |     await page.reload();
  30 |
  31 |     // Check that chat history still contains the message
  32 |     const messages = page.locator('div.flex-1 div div span');
  33 |     await expect(messages).toContainText('Test message');
  34 |   });
  35 |
  36 |   test('should handle rapid consecutive messages', async ({ page }) => {
  37 |     await page.goto('http://localhost:3000');
  38 |     const input = page.locator('input[placeholder="Type your message..."]');
  39 |     const sendButton = page.locator('button:has-text("Send")');
  40 |
  41 |     for (let i = 0; i < 5; i++) {
  42 |       await input.fill(`Message ${i}`);
  43 |       await sendButton.click();
  44 |       await page.waitForTimeout(500);
  45 |     }
  46 |
  47 |     // Check that all messages appear
  48 |     const messages = page.locator('div.flex-1 div div span');
  49 |     for (let i = 0; i < 5; i++) {
  50 |       await expect(messages).toContainText(`Message ${i}`);
  51 |     }
  52 |   });
  53 | });
  54 |
```