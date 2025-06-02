import { test, expect, _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'path';

test.describe('Extended E2E tests', () => {
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

  test('should handle invalid chat input gracefully', async () => {
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });

    await input.fill('');
    await sendButton.click();

    const errorMessage = page.locator('text=Please enter a message');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should maintain chat history after reload', async () => {
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });

    await input.fill('Hello');
    await sendButton.click();
    
    const messages = page.locator('div.flex-1 div div span');
    await expect(messages).toContainText('Hello', { timeout: 15000 });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    await expect(messages).toContainText('Hello', { timeout: 15000 });
  });

  test('should handle rapid consecutive messages', async () => {
    const input = page.locator('input[placeholder="Type your message..."]');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });

    const messages = page.locator('div.flex-1 div div span');

    for (let i = 0; i < 5; i++) {
      await input.fill(`Message ${i}`);
      await sendButton.click();
      await page.waitForTimeout(500);
    }

    for (let i = 0; i < 5; i++) {
      await expect(messages).toContainText(`Message ${i}`, { timeout: 15000 });
    }
  });
});
