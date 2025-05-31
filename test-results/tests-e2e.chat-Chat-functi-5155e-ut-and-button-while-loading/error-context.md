# Test info

- Name: Chat functionality >> should disable input and button while loading
- Location: /Users/jibbr/Desktop/hellogpt/tests/e2e.chat.spec.ts:23:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

    at /Users/jibbr/Desktop/hellogpt/tests/e2e.chat.spec.ts:5:16
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Chat functionality', () => {
   4 |   test.beforeEach(async ({ page }) => {
>  5 |     await page.goto('http://localhost:3000'); // Adjust URL as needed
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
   6 |   });
   7 |
   8 |   test('should send a message and receive a response', async ({ page }) => {
   9 |     const input = page.locator('input[placeholder="Type your message..."]');
  10 |     const sendButton = page.locator('button:has-text("Send")');
  11 |     const messages = page.locator('div.flex-1 div div span');
  12 |
  13 |     await input.fill('Hello Ollama');
  14 |     await sendButton.click();
  15 |
  16 |     // Wait for bot response to appear
  17 |     await expect(messages.last()).toHaveText(/(Mock response to: Hello Ollama|Echo: Hello Ollama|)/, { timeout: 10000 });
  18 |
  19 |     // Check that user message is displayed
  20 |     await expect(messages.first()).toHaveText('Hello Ollama');
  21 |   });
  22 |
  23 |   test('should disable input and button while loading', async ({ page }) => {
  24 |     const input = page.locator('input[placeholder="Type your message..."]');
  25 |     const sendButton = page.locator('button:has-text("Send")');
  26 |
  27 |     await input.fill('Test loading state');
  28 |     await sendButton.click();
  29 |
  30 |     await expect(input).toBeDisabled();
  31 |     await expect(sendButton).toBeDisabled();
  32 |
  33 |     // Wait for loading to finish
  34 |     await expect(input).not.toBeDisabled();
  35 |     await expect(sendButton).not.toBeDisabled();
  36 |   });
  37 | });
  38 |
```