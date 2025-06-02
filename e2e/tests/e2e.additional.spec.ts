import { test, expect, _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Additional E2E tests', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(60000);
    const appPath = path.join(process.cwd(), '..', 'dist', 'mac-arm64', 'root.app', 'Contents', 'MacOS', 'root');
    console.log('Launching app from:', appPath);
    
    // Verify the app exists and is executable
    if (!fs.existsSync(appPath)) {
      throw new Error(`App not found at path: ${appPath}`);
    }
    try {
      fs.accessSync(appPath, fs.constants.X_OK);
    } catch (error) {
      throw new Error(`App is not executable at path: ${appPath}`);
    }
    
    try {
      console.log('Launching Electron...');
      electronApp = await _electron.launch({ 
        args: [appPath],
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DEBUG: 'electron:*' // Enable Electron debug logging
        }
      });
      
      console.log('Electron launched. Getting first window...');
      page = await electronApp.firstWindow();
      
      console.log('Got first window. Waiting for domcontentloaded...');
      await page.waitForLoadState('domcontentloaded');
      
      console.log('domcontentloaded. Waiting for networkidle...');
      await page.waitForLoadState('networkidle');
      
      // Add a screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png' });
      
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

  test('should open main page and check title', async () => {
    await expect(page).toHaveTitle(/HelloGPT|App/i, { timeout: 10000 });
  });

  test('should navigate through main UI components', async () => {
    const navLinks = page.locator('nav a');
    await navLinks.first().waitFor({ state: 'visible', timeout: 10000 });
    
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    await navLinks.first().click();
  });

  test('should verify Tailwind responsive classes applied', async () => {
    const mainContainer = page.locator('div[class*="flex"]');
    await mainContainer.waitFor({ state: 'visible', timeout: 10000 });
    await expect(mainContainer).toBeVisible();
  });
});
