import { test, expect, type Page } from "@playwright/test";

const TEST_USER = {
  name: "Test User",
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

test.describe.serial("Core user flows", () => {
  // ── Registration ──────────────────────────────────────────────────────
  test("register a new account", async ({ page }) => {
    await page.goto("/register");
    await page.screenshot({ path: "e2e/screenshots/01-register-page.png" });

    await page.getByPlaceholder("Your name").fill(TEST_USER.name);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Choose a password").fill(TEST_USER.password);

    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL("/", { timeout: 15000 });
    await page.screenshot({
      path: "e2e/screenshots/02-dashboard-after-register.png",
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────
  test("sign in with existing account", async ({ page }) => {
    await page.goto("/login");
    await page.screenshot({ path: "e2e/screenshots/03-login-page.png" });

    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Enter password").fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("/", { timeout: 15000 });
    await page.screenshot({
      path: "e2e/screenshots/04-dashboard-after-login.png",
    });

    await expect(page.getByText("Locker")).toBeVisible();
    await expect(page.getByText("My Files")).toBeVisible();
  });

  // ── Empty state ───────────────────────────────────────────────────────
  test("shows empty state on fresh account", async ({ page }) => {
    await loginAs(page);

    await expect(page.getByText("No files yet")).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/05-empty-state.png" });
  });

  // ── Create folder ─────────────────────────────────────────────────────
  test("create a folder", async ({ page }) => {
    await loginAs(page);

    await page.getByRole("button", { name: /new folder/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "e2e/screenshots/06-create-folder-dialog.png",
    });

    await page.getByPlaceholder("Folder name").fill("Documents");
    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(page.getByText("Documents")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/07-folder-created.png" });
  });

  // ── Upload file ───────────────────────────────────────────────────────
  test("upload a file", async ({ page }) => {
    await loginAs(page);
    await page.waitForTimeout(1000);

    await page
      .getByRole("button", { name: /^upload$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/08-upload-dialog.png" });

    const fileInput = page.locator(
      '[data-slot="dialog-content"] input[type="file"]',
    );
    const buffer = Buffer.from("Hello, Locker! This is a test file.");
    await fileInput.setInputFiles({
      name: "test-document.txt",
      mimeType: "text/plain",
      buffer,
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/09-file-selected.png" });

    await page.getByRole("button", { name: /upload 1 file/i }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e/screenshots/10-upload-complete.png" });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    await expect(page.getByText("test-document.txt")).toBeVisible({
      timeout: 5000,
    });
    await page.screenshot({ path: "e2e/screenshots/11-file-in-list.png" });
  });

  // ── Navigate into folder ──────────────────────────────────────────────
  test("navigate into a folder", async ({ page }) => {
    await loginAs(page);

    await page.getByText("Documents").click();
    await page.waitForURL(/\/folder\//);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/12-inside-folder.png" });

    await expect(page.getByText("Home")).toBeVisible();
  });

  // ── Share a file ──────────────────────────────────────────────────────
  test("share a file via context menu", async ({ page }) => {
    await loginAs(page);
    await expect(page.getByText("test-document.txt")).toBeVisible({
      timeout: 5000,
    });

    await openFileContextMenu(page, "test-document.txt");
    await page.screenshot({ path: "e2e/screenshots/13-file-context-menu.png" });

    await page.getByRole("menuitem", { name: /share/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/14-share-dialog.png" });

    await page.getByRole("button", { name: /create link/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "e2e/screenshots/15-share-link-created.png",
    });

    await page.getByRole("button", { name: /done/i }).click();
  });

  // ── Share Links page ──────────────────────────────────────────────────
  test("view share links page", async ({ page }) => {
    await loginAs(page);

    await page
      .locator('[data-sidebar="menu-button"]', { hasText: "Share Links" })
      .click();
    await page.waitForURL("/shared-links");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/16-share-links-page.png" });
  });

  // ── Upload Links page ─────────────────────────────────────────────────
  test("view upload links page", async ({ page }) => {
    await loginAs(page);

    await page
      .locator('[data-sidebar="menu-button"]', { hasText: "Upload Links" })
      .click();
    await page.waitForURL("/upload-links");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/17-upload-links-page.png" });
  });

  // ── Rename a file ─────────────────────────────────────────────────────
  test("rename a file", async ({ page }) => {
    await loginAs(page);
    await expect(page.getByText("test-document.txt")).toBeVisible({
      timeout: 5000,
    });

    await openFileContextMenu(page, "test-document.txt");
    await page.getByRole("menuitem", { name: /rename/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/18-rename-dialog.png" });

    const nameInput = page.locator('[data-slot="dialog-content"] input');
    await nameInput.fill("renamed-document.txt");
    await page.getByRole("button", { name: /^rename$/i }).click();

    await page.waitForTimeout(2000);
    await expect(page.getByText("renamed-document.txt")).toBeVisible({
      timeout: 5000,
    });
    await page.screenshot({ path: "e2e/screenshots/19-file-renamed.png" });
  });

  // ── Delete a file ─────────────────────────────────────────────────────
  test("delete a file", async ({ page }) => {
    await loginAs(page);
    await expect(page.getByText("renamed-document.txt")).toBeVisible({
      timeout: 5000,
    });

    await openFileContextMenu(page, "renamed-document.txt");
    await page.getByRole("menuitem", { name: /delete/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e/screenshots/20-after-file-delete.png" });
  });

  // ── Mobile sidebar toggle ────────────────────────────────────────────
  test("mobile sidebar toggle works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page);

    await page.screenshot({ path: "e2e/screenshots/21-mobile-view.png" });

    const trigger = page.locator('[data-sidebar="trigger"]');
    if (await trigger.isVisible()) {
      await trigger.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "e2e/screenshots/22-mobile-sidebar-open.png",
      });
    }
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────

async function loginAs(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("Enter password").fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/", { timeout: 15000 });
  await page.waitForTimeout(1000);
}

async function openFileContextMenu(page: Page, fileName: string) {
  // Each file/folder row is a grid div; the last column has the dropdown trigger.
  // We find the text, go up to the row div, then find the button inside.
  const row = page.locator("div.grid", { hasText: fileName }).first();
  await row.hover();
  await page.waitForTimeout(300);

  // The dropdown trigger button is the last button in the row
  const menuBtn = row.locator("button").last();
  await menuBtn.click({ force: true });
  await page.waitForTimeout(300);
}
