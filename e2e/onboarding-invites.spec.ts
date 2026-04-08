import { test, expect, type Page } from "@playwright/test";

/**
 * Tests that a newly registered user who has pending workspace invites
 * sees those invites on the onboarding page and can accept one to join
 * a workspace without needing to create their own.
 */

const INVITER = {
  name: "Inviter User",
  email: `inviter-ob-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const INVITEE = {
  name: "New User",
  email: `newuser-ob-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const WORKSPACE_NAME = "Onboard Invite WS";

test.describe.serial("Onboarding with pending invites", () => {
  // ── Step 1: Inviter creates account + workspace ────────────────────

  test("inviter sets up workspace", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(INVITER.name);
    await page.getByPlaceholder("you@example.com").fill(INVITER.email);
    await page.getByPlaceholder("Choose a password").fill(INVITER.password);
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
    await page.screenshot({
      path: "e2e/screenshots/ob-inv-01-inviter-workspace.png",
    });
  });

  // ── Step 2: Register the invitee (so they exist in the system) ─────

  test("register invitee account", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(INVITEE.name);
    await page.getByPlaceholder("you@example.com").fill(INVITEE.email);
    await page.getByPlaceholder("Choose a password").fill(INVITEE.password);
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // New user lands on onboarding — no invites yet, just the create form
    await expect(page.getByText("Get started")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Acme Inc")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/ob-inv-02-invitee-no-invites.png",
    });
  });

  // ── Step 3: Inviter sends invite to invitee ────────────────────────

  test("inviter sends invite to invitee", async ({ page }) => {
    // Clear any session from previous test
    await page.context().clearCookies();

    // Login as inviter
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(INVITER.email);
    await page.getByPlaceholder("Enter password").fill(INVITER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Navigate to members
    await page.locator("a", { hasText: "Members" }).first().click();
    await page.waitForURL(/\/settings\/members/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Send invite
    await page
      .getByPlaceholder("colleague@company.com")
      .fill(INVITEE.email);
    await page.getByRole("button", { name: /invite/i }).click();
    await page.waitForTimeout(2000);

    // Verify invite was created
    await expect(page.getByText(INVITEE.email)).toBeVisible({ timeout: 5000 });
    await page.screenshot({
      path: "e2e/screenshots/ob-inv-03-invite-sent.png",
    });
  });

  // ── Step 4: Invitee sees invite on onboarding page ─────────────────

  test("invitee sees pending invite on onboarding page", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(INVITEE.email);
    await page.getByPlaceholder("Enter password").fill(INVITEE.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(2000);

    // Should be on onboarding (no workspaces yet)
    await page.goto("/onboarding");
    await page.waitForTimeout(2000);

    // Should see the pending invite
    await expect(page.getByText(WORKSPACE_NAME)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Invited by/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /join/i })).toBeVisible();

    // Should also still show the create workspace form
    await expect(page.getByText("or create a new workspace")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Acme Inc")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/ob-inv-04-invitee-sees-invite.png",
    });
  });

  // ── Step 5: Invitee accepts invite from onboarding ─────────────────

  test("invitee accepts invite and lands in workspace", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(INVITEE.email);
    await page.getByPlaceholder("Enter password").fill(INVITEE.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(2000);

    await page.goto("/onboarding");
    await page.waitForTimeout(2000);

    // Click "Join" on the invite card
    await page.getByRole("button", { name: /join/i }).click();

    // Should redirect to the workspace
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Verify we're in the correct workspace
    await expect(page.getByText("My Files")).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/ob-inv-05-invitee-in-workspace.png",
    });
  });
});
