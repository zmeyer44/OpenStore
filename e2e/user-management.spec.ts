import { test, expect, type Page } from "@playwright/test";

const TEST_USER = {
  name: "User Mgmt Test",
  email: `user-mgmt-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const WORKSPACE_NAME = "UserMgmt Workspace";

test.describe.serial("User management flows", () => {
  // ── Setup: register + create workspace ──────────────────────────────

  test("register and create workspace", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(TEST_USER.name);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Choose a password").fill(TEST_USER.password);
    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 15000,
    });

    // Create workspace if on onboarding
    if (page.url().includes("/onboarding")) {
      await page.getByPlaceholder("e.g. Acme Inc").fill(WORKSPACE_NAME);
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.waitForURL(/\/w\//, { timeout: 15000 });
    }
    await page.waitForTimeout(1000);
  });

  // ── User menu opens and shows user info ──────────────────────────────

  test("user menu shows avatar and username at sidebar bottom", async ({
    page,
  }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // User menu trigger should be visible with the user's name
    const displayName = TEST_USER.name;
    await expect(
      page.locator("[data-slot='popover-trigger']", { hasText: displayName }),
    ).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/um-01-user-menu-trigger.png",
    });
  });

  test("user menu popover opens with user info and options", async ({
    page,
  }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Click the user menu trigger
    const trigger = page.locator("[data-slot='popover-trigger']", {
      hasText: TEST_USER.name,
    });
    await trigger.click();
    await page.waitForTimeout(500);

    // Verify popover content
    const popover = page.locator("[data-slot='popover-content']");
    await expect(popover).toBeVisible();

    // Should show user name and email
    await expect(popover.getByText(TEST_USER.name)).toBeVisible();
    await expect(popover.getByText(TEST_USER.email)).toBeVisible();

    // Should show menu items
    await expect(popover.getByText("Theme")).toBeVisible();
    await expect(popover.getByText("Account Settings")).toBeVisible();
    await expect(popover.getByText("Log Out")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/um-02-user-menu-popover.png",
    });
  });

  // ── Theme switching ──────────────────────────────────────────────────

  test("theme toggle switches between light and dark", async ({ page }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Open user menu
    const trigger = page.locator("[data-slot='popover-trigger']", {
      hasText: TEST_USER.name,
    });
    await trigger.click();
    await page.waitForTimeout(500);

    // Click the dark mode button (Moon icon)
    const darkButton = page.locator("[data-slot='popover-content']").getByRole("button", {
      name: "Dark",
    });
    await darkButton.click();
    await page.waitForTimeout(500);

    // Verify the html element has the 'dark' class
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");

    await page.screenshot({
      path: "e2e/screenshots/um-03-dark-mode.png",
    });

    // Switch to light mode
    const lightButton = page.locator("[data-slot='popover-content']").getByRole("button", {
      name: "Light",
    });
    await lightButton.click();
    await page.waitForTimeout(500);

    const htmlClassAfter = await page.locator("html").getAttribute("class");
    expect(htmlClassAfter).not.toContain("dark");

    await page.screenshot({
      path: "e2e/screenshots/um-04-light-mode.png",
    });
  });

  // ── Navigate to account settings ─────────────────────────────────────

  test("navigate to account settings from user menu", async ({ page }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Open user menu
    const trigger = page.locator("[data-slot='popover-trigger']", {
      hasText: TEST_USER.name,
    });
    await trigger.click();
    await page.waitForTimeout(500);

    // Click Account Settings
    await page
      .locator("[data-slot='popover-content']")
      .getByText("Account Settings")
      .click();
    await page.waitForURL("/settings/account", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "e2e/screenshots/um-05-account-settings.png",
    });

    // Verify account settings page content
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Password" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Danger zone" }),
    ).toBeVisible();
  });

  // ── Account settings: profile section ────────────────────────────────

  test("account settings shows current user data", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/account");
    await page.waitForTimeout(2000);

    // Should show user's name in the input
    const nameInput = page.getByPlaceholder("Your name");
    await expect(nameInput).toHaveValue(TEST_USER.name);

    // Should show user's email in the input
    const emailInput = page.getByPlaceholder("you@example.com");
    await expect(emailInput).toHaveValue(TEST_USER.email);

    await page.screenshot({
      path: "e2e/screenshots/um-06-account-profile-loaded.png",
    });
  });

  // ── Update profile name ──────────────────────────────────────────────

  test("update profile name", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/account");
    await page.waitForTimeout(2000);

    const nameInput = page.getByPlaceholder("Your name");
    await nameInput.fill("Updated Name");

    // Save button should appear
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "e2e/screenshots/um-07-profile-updated.png",
    });

    // Reload and verify the change persisted
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.getByPlaceholder("Your name")).toHaveValue(
      "Updated Name",
    );
  });

  // ── Password section visible ─────────────────────────────────────────

  test("password section shows change form", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/account");
    await page.waitForTimeout(2000);

    // Should show password section with current password field
    await expect(
      page.getByPlaceholder("Enter current password"),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("At least 8 characters"),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Repeat new password"),
    ).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/um-08-password-section.png",
    });
  });

  // ── Password validation ──────────────────────────────────────────────

  test("password form shows mismatch error", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/account");
    await page.waitForTimeout(2000);

    await page.getByPlaceholder("At least 8 characters").fill("newpassword1");
    await page.getByPlaceholder("Repeat new password").fill("different");

    await expect(page.getByText("Passwords do not match")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/um-09-password-mismatch.png",
    });
  });

  // ── Sign out from user menu ──────────────────────────────────────────

  test("sign out from user menu redirects to login", async ({ page }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Open user menu
    const trigger = page.locator("[data-slot='popover-trigger']", {
      hasText: "Updated Name",
    });
    await trigger.click();
    await page.waitForTimeout(500);

    // Click Log Out
    await page
      .locator("[data-slot='popover-content']")
      .getByText("Log Out")
      .click();

    // Should redirect to login page
    await page.waitForURL("/login", { timeout: 10000 });
    await page.screenshot({
      path: "e2e/screenshots/um-10-signed-out.png",
    });

    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────

async function loginAs(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("Enter password").fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
}
