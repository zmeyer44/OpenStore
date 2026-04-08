import { test, expect, type Page } from "@playwright/test";

const TEST_USER = {
  name: "Notif Test User",
  email: `notif-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const WORKSPACE_NAME = "Notif Workspace";

test.describe.serial("Notifications flows", () => {
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

    if (page.url().includes("/onboarding")) {
      await page.getByPlaceholder("e.g. Acme Inc").fill(WORKSPACE_NAME);
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.waitForURL(/\/w\//, { timeout: 15000 });
    }
    await page.waitForTimeout(1000);
  });

  // ── Bell icon is visible in sidebar ──────────────────────────────────

  test("bell icon is visible in sidebar", async ({ page }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const bell = page.getByRole("button", { name: "Notifications" });
    await expect(bell).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/notif-01-bell-visible.png",
    });
  });

  // ── Bell navigates to notifications page ─────────────────────────────

  test("clicking bell navigates to notifications page", async ({ page }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const bell = page.getByRole("button", { name: "Notifications" });
    await bell.click();

    await page.waitForURL("/settings/notifications", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "e2e/screenshots/notif-02-notifications-page.png",
    });

    // Should show the page header
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });

  // ── Empty state shows when no notifications ──────────────────────────

  test("empty state displayed when no notifications", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/notifications");
    await page.waitForTimeout(2000);

    await expect(page.getByText("No notifications")).toBeVisible();
    await expect(page.getByText("all caught up")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/notif-03-empty-state.png",
    });
  });

  // ── Sidebar shows account nav on notifications page ──────────────────

  test("sidebar shows account nav on notifications page", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/notifications");
    await page.waitForTimeout(2000);

    // Sidebar should show Account and Notifications links
    await expect(page.getByText("Account")).toBeVisible();
    // Look for the nav item specifically
    const notifNavItem = page.locator("a", { hasText: "Notifications" });
    await expect(notifNavItem.first()).toBeVisible();

    // Should also show Workspaces section
    await expect(page.getByText("Workspaces")).toBeVisible();
    await expect(page.getByText(WORKSPACE_NAME)).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/notif-04-account-sidebar.png",
    });
  });

  // ── Notifications link in user menu popover ──────────────────────────

  test("user menu popover has notifications link", async ({ page }) => {
    await loginAs(page);
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Open user menu popover
    const trigger = page.locator("[data-slot='popover-trigger']", {
      hasText: TEST_USER.name,
    });
    await trigger.click();
    await page.waitForTimeout(500);

    const popover = page.locator("[data-slot='popover-content']");
    await expect(popover.getByText("Notifications")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/notif-05-menu-notifications-link.png",
    });
  });

  // ── Invite creates notification for existing user ────────────────────

  test("inviting existing user creates notification", async ({ page }) => {
    // Create a second user who will receive the invite notification
    const SECOND_USER = {
      name: "Invited User",
      email: `invited-notif-${Date.now()}@example.com`,
      password: "TestPassword123!",
    };

    // Register the second user
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(SECOND_USER.name);
    await page.getByPlaceholder("you@example.com").fill(SECOND_USER.email);
    await page
      .getByPlaceholder("Choose a password")
      .fill(SECOND_USER.password);
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // Sign out the second user explicitly
    await page.context().clearCookies();

    // Login as the first user and send an invite
    await page.goto("/login");
    await page.waitForTimeout(500);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Enter password").fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Navigate to members page
    await page
      .locator("a", { hasText: "Members" })
      .first()
      .click();
    await page.waitForURL(/\/settings\/members/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Invite the second user
    await page
      .getByPlaceholder("colleague@company.com")
      .fill(SECOND_USER.email);
    await page.getByRole("button", { name: /invite/i }).click();
    await page.waitForTimeout(2000);

    // Sign out first user and login as second user to check notifications
    await page.context().clearCookies();
    await page.goto("/login");
    await page.waitForTimeout(500);
    await page.getByPlaceholder("you@example.com").fill(SECOND_USER.email);
    await page.getByPlaceholder("Enter password").fill(SECOND_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    // Navigate to notifications
    await page.goto("/settings/notifications");
    await page.waitForTimeout(2000);

    // Should show the invite notification
    await expect(page.getByText(/invited you to/i)).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/notif-06-invite-notification.png",
    });
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
