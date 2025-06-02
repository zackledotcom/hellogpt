import { test, expect, _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'path';

test.describe('Chat functionality', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(60000);
    const appPath = path.join(process.cwd(), '..', 'dist', 'mac-arm64', 'root.app', 'Contents', 'MacOS', 'root');
    console.log('Launching app from:', appPath);
    
    try {
      console.log('Launching Electron...');
      electronApp = await _electron.launch({ 
        args: [appPath],
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });
      
      console.log('Electron launched. Getting first window...');
      page = await electronApp.firstWindow();
      
      console.log('Got first window. Waiting for domcontentloaded...');
      await page.waitForLoadState('domcontentloaded');
      
      console.log('domcontentloaded. Waiting for networkidle...');
      await page.waitForLoadState('networkidle');
      
      console.log('networkidle. App should be ready.');
    } catch (error) {
      console.error('Failed to launch Electron app:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should send a message and receive a response', async () => {
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });
    
    const messages = page.locator('div.flex-1 div div span');
    
    await input.fill('Hello Ollama');
    await sendButton.click();

    await expect(messages.last()).not.toHaveText('', { timeout: 15000 });
    await expect(messages.last()).not.toHaveText('Mock response to: Hello Ollama');
    await expect(messages.first()).toHaveText('Hello Ollama');
  });

  test('should disable input and button while loading', async () => {
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });

    await input.fill('Test loading state');
    await sendButton.click();

    await expect(input).toBeDisabled();
    await expect(sendButton).toBeDisabled();

    await expect(input).not.toBeDisabled({ timeout: 15000 });
    await expect(sendButton).not.toBeDisabled({ timeout: 15000 });
  });
});
