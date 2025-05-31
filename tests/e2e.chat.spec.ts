import { test, expect } from '@playwright/test';

test.describe('Chat functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000'); // Adjust URL as needed
  });

  test('should send a message and receive a response', async ({ page }) => {
    const input = page.locator('input[placeholder="Type your message..."]');
    const sendButton = page.locator('button:has-text("Send")');
    const messages = page.locator('div.flex-1 div div span');

    await input.fill('Hello Ollama');
    await sendButton.click();

    // Wait for bot response to appear
    await expect(messages.last()).toHaveText(/(Mock response to: Hello Ollama|Echo: Hello Ollama|)/, { timeout: 10000 });

    // Check that user message is displayed
    await expect(messages.first()).toHaveText('Hello Ollama');
  });

  test('should disable input and button while loading', async ({ page }) => {
    const input = page.locator('input[placeholder="Type your message..."]');
    const sendButton = page.locator('button:has-text("Send")');

    await input.fill('Test loading state');
    await sendButton.click();

    await expect(input).toBeDisabled();
    await expect(sendButton).toBeDisabled();

    // Wait for loading to finish
    await expect(input).not.toBeDisabled();
    await expect(sendButton).not.toBeDisabled();
  });
});
