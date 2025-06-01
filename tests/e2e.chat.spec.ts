import { test, expect, _electron } from '@playwright/test';

test.describe('Chat functionality', () => {
  let electronApp: import('playwright').ElectronApplication;
  let page: import('playwright').Page;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await _electron.launch({ args: ['.'] });
    page = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should send a message and receive a response', async () => {
    await page.goto('http://localhost:3000'); // Adjust URL if needed

    const input = page.locator('input[placeholder="Type your message..."]');
    const sendButton = page.locator('button:has-text("Send")');
    const messages = page.locator('div.flex-1 div div span');

    await input.fill('Hello Ollama');
    await sendButton.click();

    // Wait for bot response to appear (expect real Ollama response, no mocks)
    await expect(messages.last()).not.toHaveText('', { timeout: 15000 });
    await expect(messages.last()).not.toHaveText('Mock response to: Hello Ollama');

    // Check that user message is displayed
    await expect(messages.first()).toHaveText('Hello Ollama');
  });

  test('should disable input and button while loading', async () => {
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
