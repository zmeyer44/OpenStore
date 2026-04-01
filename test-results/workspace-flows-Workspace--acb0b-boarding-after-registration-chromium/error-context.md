# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace-flows.spec.ts >> Workspace flows >> new user is redirected to onboarding after registration
- Location: e2e/workspace-flows.spec.ts:13:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e9]: OpenStore
    - heading "Create account" [level=1] [ref=e10]
    - paragraph [ref=e11]: Start storing your files securely
    - generic [ref=e12]:
      - generic [ref=e13]:
        - text: Name
        - textbox "Your name" [ref=e14]: Workspace Test User
      - generic [ref=e15]:
        - text: Email
        - textbox "you@example.com" [ref=e16]: ws-test-1775040922189@example.com
      - generic [ref=e17]:
        - text: Password
        - textbox "Choose a password" [ref=e18]: TestPassword123!
      - button "Create account" [ref=e19]
    - paragraph [ref=e20]:
      - text: Already have an account?
      - link "Sign in" [ref=e21] [cursor=pointer]:
        - /url: /login
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
  - alert [ref=e31]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | const TEST_USER = {
  4   |   name: 'Workspace Test User',
  5   |   email: `ws-test-${Date.now()}@example.com`,
  6   |   password: 'TestPassword123!',
  7   | };
  8   | 
  9   | const WORKSPACE_NAME = 'Test Workspace';
  10  | 
  11  | test.describe.serial('Workspace flows', () => {
  12  |   // ── Registration redirects to onboarding ──────────────────────────────
  13  |   test('new user is redirected to onboarding after registration', async ({
  14  |     page,
  15  |   }) => {
  16  |     // Capture console errors
  17  |     page.on('console', (msg) => {
  18  |       if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  19  |     });
  20  |     page.on('response', (response) => {
  21  |       if (response.status() >= 400) {
  22  |         console.log(`HTTP ${response.status()}: ${response.url()}`);
  23  |       }
  24  |     });
  25  | 
  26  |     await page.goto('/register');
  27  |     await page.getByPlaceholder('Your name').fill(TEST_USER.name);
  28  |     await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
  29  |     await page.getByPlaceholder('Choose a password').fill(TEST_USER.password);
  30  |     await page.getByRole('button', { name: /create account/i }).click();
  31  | 
  32  |     // Wait for navigation away from register page
> 33  |     await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  34  |     await page.screenshot({ path: 'e2e/screenshots/ws-01-onboarding.png' });
  35  | 
  36  |     await expect(page.getByText('Create your workspace')).toBeVisible();
  37  |   });
  38  | 
  39  |   // ── Create workspace ──────────────────────────────────────────────────
  40  |   test('create workspace from onboarding', async ({ page }) => {
  41  |     await loginAs(page);
  42  |     // Should redirect to onboarding since no workspace exists yet
  43  |     await page.waitForURL('/onboarding', { timeout: 15000 });
  44  | 
  45  |     await page.getByPlaceholder('e.g. Acme Inc').fill(WORKSPACE_NAME);
  46  |     await page.getByRole('button', { name: /create workspace/i }).click();
  47  | 
  48  |     // Should redirect to the new workspace
  49  |     await page.waitForURL(/\/w\//, { timeout: 15000 });
  50  |     await page.waitForTimeout(1000);
  51  |     await page.screenshot({ path: 'e2e/screenshots/ws-02-workspace-created.png' });
  52  | 
  53  |     // Verify workspace sidebar shows correctly
  54  |     await expect(page.getByText('My Files')).toBeVisible();
  55  |     await expect(page.getByText('Settings')).toBeVisible();
  56  |   });
  57  | 
  58  |   // ── Dashboard with workspace sidebar ──────────────────────────────────
  59  |   test('workspace dashboard shows sidebar with nav', async ({ page }) => {
  60  |     await loginAs(page);
  61  |     await page.waitForURL(/\/w\//, { timeout: 15000 });
  62  |     await page.waitForTimeout(1000);
  63  | 
  64  |     await expect(page.getByText('My Files')).toBeVisible();
  65  |     await expect(page.getByText('Share Links')).toBeVisible();
  66  |     await expect(page.getByText('Upload Links')).toBeVisible();
  67  |     await expect(page.getByText('Settings')).toBeVisible();
  68  |     await expect(page.getByText('Members')).toBeVisible();
  69  | 
  70  |     await page.screenshot({ path: 'e2e/screenshots/ws-03-dashboard-sidebar.png' });
  71  |   });
  72  | 
  73  |   // ── Create folder in workspace ────────────────────────────────────────
  74  |   test('create folder in workspace', async ({ page }) => {
  75  |     await loginAs(page);
  76  |     await page.waitForURL(/\/w\//, { timeout: 15000 });
  77  |     await page.waitForTimeout(1000);
  78  | 
  79  |     await page.getByRole('button', { name: /new folder/i }).click();
  80  |     await page.waitForTimeout(500);
  81  |     await page.getByPlaceholder('Folder name').fill('Workspace Docs');
  82  |     await page.getByRole('button', { name: /^create$/i }).click();
  83  | 
  84  |     await expect(page.getByText('Workspace Docs')).toBeVisible({ timeout: 5000 });
  85  |     await page.screenshot({ path: 'e2e/screenshots/ws-04-folder-created.png' });
  86  |   });
  87  | 
  88  |   // ── Upload file in workspace ──────────────────────────────────────────
  89  |   test('upload file in workspace', async ({ page }) => {
  90  |     await loginAs(page);
  91  |     await page.waitForURL(/\/w\//, { timeout: 15000 });
  92  |     await page.waitForTimeout(1000);
  93  | 
  94  |     await page.getByRole('button', { name: /^upload$/i }).first().click();
  95  |     await page.waitForTimeout(500);
  96  | 
  97  |     const fileInput = page.locator('[data-slot="dialog-content"] input[type="file"]');
  98  |     await fileInput.setInputFiles({
  99  |       name: 'workspace-file.txt',
  100 |       mimeType: 'text/plain',
  101 |       buffer: Buffer.from('Workspace test file content'),
  102 |     });
  103 | 
  104 |     await page.waitForTimeout(500);
  105 |     await page.getByRole('button', { name: /upload 1 file/i }).click();
  106 |     await page.waitForTimeout(3000);
  107 | 
  108 |     await page.keyboard.press('Escape');
  109 |     await page.waitForTimeout(1000);
  110 | 
  111 |     await expect(page.getByText('workspace-file.txt')).toBeVisible({ timeout: 5000 });
  112 |     await page.screenshot({ path: 'e2e/screenshots/ws-05-file-uploaded.png' });
  113 |   });
  114 | 
  115 |   // ── Navigate to settings ──────────────────────────────────────────────
  116 |   test('workspace settings page', async ({ page }) => {
  117 |     await loginAs(page);
  118 |     await page.waitForURL(/\/w\//, { timeout: 15000 });
  119 |     await page.waitForTimeout(1000);
  120 | 
  121 |     await page.locator('[data-sidebar="menu-button"]', { hasText: 'Settings' }).click();
  122 |     await page.waitForURL(/\/settings$/);
  123 |     await page.waitForTimeout(1000);
  124 |     await page.screenshot({ path: 'e2e/screenshots/ws-06-settings.png' });
  125 | 
  126 |     await expect(page.getByText('General')).toBeVisible();
  127 |     await expect(page.getByText('Storage')).toBeVisible();
  128 |     await expect(page.getByText('Danger zone')).toBeVisible();
  129 |   });
  130 | 
  131 |   // ── Navigate to members ───────────────────────────────────────────────
  132 |   test('members page shows current user as owner', async ({ page }) => {
  133 |     await loginAs(page);
```