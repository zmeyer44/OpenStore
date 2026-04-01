import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  name: 'S3 API User',
  email: `s3-api-${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

test.describe.serial('S3-Compatible API', () => {
  let workspaceSlug: string;

  test('setup: create account, workspace', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Your name').fill(TEST_USER.name);
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Choose a password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });

    await page.getByPlaceholder('e.g. Acme Inc').fill('S3 Test Workspace');
    await page.getByRole('button', { name: /create workspace/i }).click();
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Extract workspace slug from URL
    const url = page.url();
    const match = url.match(/\/w\/([^/]+)/);
    workspaceSlug = match?.[1] ?? '';
    expect(workspaceSlug).toBeTruthy();
  });

  test('API keys page shows connection info', async ({ page }) => {
    await loginAs(page);
    await page.waitForTimeout(1000);

    // Navigate to API keys page
    await page.locator('[data-sidebar="menu-button"]', { hasText: 'API Keys' }).click();
    await page.waitForURL(/\/settings\/api-keys/);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/s3-01-api-keys-page.png' });

    await expect(page.getByText('S3-Compatible API')).toBeVisible();
    await expect(page.getByText('Endpoint URL')).toBeVisible();
    await expect(page.getByText('Bucket name')).toBeVisible();
    await expect(page.getByText('No API keys yet')).toBeVisible();
  });

  test('create an API key', async ({ page }) => {
    await loginAs(page);
    await page.locator('[data-sidebar="menu-button"]', { hasText: 'API Keys' }).click();
    await page.waitForURL(/\/settings\/api-keys/);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /create key/i }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder('e.g. CI/CD pipeline').fill('Test Key');
    await page.getByRole('button', { name: /^create$/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/s3-02-key-created.png' });

    // Key reveal dialog should be visible
    await expect(page.getByText('API Key Created')).toBeVisible();
    await expect(page.getByText('Access Key ID')).toBeVisible();
    await expect(page.getByText('Secret Access Key')).toBeVisible();

    // Close the dialog
    await page.getByRole('button', { name: /done/i }).click();
    await page.waitForTimeout(500);

    // Key should appear in the list
    await expect(page.getByText('Test Key')).toBeVisible();
    await expect(page.getByText(/OSAK/)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/s3-03-key-in-list.png' });
  });
});

async function loginAs(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
  await page.getByPlaceholder('Enter password').fill(TEST_USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/w\//, { timeout: 15000 });
  await page.waitForTimeout(1000);
}
