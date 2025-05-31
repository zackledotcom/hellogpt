import { test, expect } from '@playwright/test';

test.describe('Extended E2E tests', () => {
  test('should handle invalid chat input gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const input = page.locator('input[placeholder="Type your message..."]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('');
    await sendButton.click();

    // Expect some validation error or no response
    const errorMessage = page.locator('text=Please enter a message');
    await expect(errorMessage).toBeVisible();
  });

  test('should maintain chat history after reload', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const input = page.locator('input[placeholder="Type your message..."]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Test message');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();

    // Check that chat history still contains the message
    const messages = page.locator('div.flex-1 div div span');
    await expect(messages).toContainText('Test message');
  });

  test('should handle rapid consecutive messages', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const input = page.locator('input[placeholder="Type your message..."]');
    const sendButton = page.locator('button:has-text("Send")');

    for (let i = 0; i < 5; i++) {
      await input.fill(`Message ${i}`);
      await sendButton.click();
      await page.waitForTimeout(500);
    }

    // Check that all messages appear
    const messages = page.locator('div.flex-1 div div span');
    for (let i = 0; i < 5; i++) {
      await expect(messages).toContainText(`Message ${i}`);
    }
  });
});
