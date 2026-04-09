import { test, expect, type Page } from "@playwright/test";

const TEST_USER = {
  name: "KB Improve Test User",
  email: `kb-improve-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const TAG_A = "Product Docs";
const TAG_B = "Engineering Notes";
const KB_NAME = "Multi-Tag KB";
const KB_DESCRIPTION = "Testing many-to-many tag support";
const SOURCE_FILE = "multi-tag-source.txt";
const SOURCE_CONTENT =
  "Knowledge bases can now be linked to multiple tags. " +
  "Each tag can also be linked to multiple knowledge bases. " +
  "This enables flexible document organization across topics.";

test.describe.serial("KB improvements: multi-tag, chat UI, graph view", () => {
  // ── Setup ───────────────────────────────────────────────────────────────
  test("setup: register, create two tags, upload and tag a file", async ({
    page,
  }) => {
    await dismissKBAnnouncementViaStorage(page);

    // Register
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(TEST_USER.name);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Choose a password").fill(TEST_USER.password);
    await page.getByRole("button", { name: /create account/i }).click();

    // Onboard
    await page.waitForURL("/onboarding", { timeout: 15000 });
    await page.getByPlaceholder("e.g. Acme Inc").fill("KB Improve Workspace");
    await page.getByRole("button", { name: /create workspace/i }).click();
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "e2e/screenshots/kbi-01-workspace.png",
    });

    // Upload a source file
    await page.getByRole("button", { name: /upload/i }).first().click();
    await page.waitForTimeout(500);
    const fileInput = page.locator(
      '[data-slot="dialog-content"] input[type="file"]',
    );
    await fileInput.setInputFiles({
      name: SOURCE_FILE,
      mimeType: "text/plain",
      buffer: Buffer.from(SOURCE_CONTENT),
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /upload 1 file/i }).click();
    await page.waitForTimeout(3000);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);
    await expect(page.getByText(SOURCE_FILE)).toBeVisible({ timeout: 5000 });

    // Create two tags via Manage Tags
    const tagIconBtn = page
      .locator('header [data-slot="tooltip-trigger"]')
      .first();
    await expect(tagIconBtn).toBeVisible({ timeout: 5000 });
    await tagIconBtn.click();
    await page.waitForTimeout(500);

    // Tag A
    await page.getByPlaceholder("New tag name...").fill(TAG_A);
    await page.getByRole("button", { name: /^add$/i }).click();
    await page.waitForTimeout(1000);
    await expect(
      page.locator('[data-slot="dialog-content"]').getByText(TAG_A),
    ).toBeVisible({ timeout: 5000 });

    // Tag B
    await page.getByPlaceholder("New tag name...").fill(TAG_B);
    await page.getByRole("button", { name: /^add$/i }).click();
    await page.waitForTimeout(1000);
    await expect(
      page.locator('[data-slot="dialog-content"]').getByText(TAG_B),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-02-tags-created.png",
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Tag the file with TAG_A
    await openFileContextMenu(page, SOURCE_FILE);
    await page.getByRole("menuitem", { name: /edit tags/i }).click();
    await page.waitForTimeout(500);
    const dialog = page.locator('[data-slot="dialog-content"]');
    await dialog.locator("button", { hasText: TAG_A }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^save$/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "e2e/screenshots/kbi-03-file-tagged.png",
    });
  });

  // ── Install KB plugin ──────────────────────────────────────────────────
  test("install KB plugin", async ({ page }) => {
    await loginAs(page);

    await page.getByRole("link", { name: "Plugins" }).click();
    await page.waitForTimeout(1000);

    const availableSection = page.locator("section", {
      hasText: "Available",
    });
    const kbPlugin = availableSection.locator("div.rounded-xl", {
      hasText: "Knowledge Base",
    });
    await expect(kbPlugin).toBeVisible({ timeout: 5000 });
    await kbPlugin.getByRole("button", { name: /^install$/i }).click();
    await page.waitForTimeout(500);

    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole("button", { name: /^install$/i })
      .click();
    await page.waitForTimeout(2000);

    const installedSection = page.locator("section", {
      hasText: "Installed",
    });
    await expect(
      installedSection.getByText("Knowledge Base").first(),
    ).toBeVisible({ timeout: 5000 });
    await page.screenshot({
      path: "e2e/screenshots/kbi-04-plugin-installed.png",
    });
  });

  // ── Create KB with multiple tags ───────────────────────────────────────
  test("create KB with multiple tags selected", async ({ page }) => {
    await loginAs(page);

    await page.getByText("Knowledge Base", { exact: true }).click();
    await page.waitForTimeout(1000);

    await page
      .getByRole("button", { name: /create knowledge base/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[data-slot="dialog-content"]');

    // Verify the multi-tag description
    await expect(
      dialog.getByText("Select one or more tags"),
    ).toBeVisible({ timeout: 5000 });

    // Fill name
    await dialog
      .getByPlaceholder("e.g. Product Documentation")
      .fill(KB_NAME);

    // Select multiple tags — these are toggle buttons, not a Select dropdown
    // Both tags should be visible in the tag list
    await expect(dialog.getByText(TAG_A)).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(TAG_B)).toBeVisible({ timeout: 5000 });

    // Click TAG_A to select it
    await dialog.locator("button", { hasText: TAG_A }).click();
    await page.waitForTimeout(200);

    // Click TAG_B to select it
    await dialog.locator("button", { hasText: TAG_B }).click();
    await page.waitForTimeout(200);

    // Both should now be highlighted (have checkmark)
    await expect(
      dialog.locator("button", { hasText: TAG_A }).locator("span", { hasText: "\u2713" }),
    ).toBeVisible();
    await expect(
      dialog.locator("button", { hasText: TAG_B }).locator("span", { hasText: "\u2713" }),
    ).toBeVisible();

    // Add description
    await dialog
      .getByPlaceholder("Optional description")
      .fill(KB_DESCRIPTION);

    await page.screenshot({
      path: "e2e/screenshots/kbi-05-multi-tag-form.png",
    });

    // Create
    await dialog.getByRole("button", { name: /^create$/i }).click();

    // Wait for the dialog to close (onSuccess)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify the KB appears in the list with BOTH tags shown as badges
    await expect(page.getByText(KB_NAME).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(TAG_A).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(TAG_B).first()).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/kbi-06-kb-with-multi-tags.png",
    });
  });

  // ── KB detail header shows multiple tags ───────────────────────────────
  test("KB detail header shows both tags", async ({ page }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    // Both tags should appear as badges in the header
    const header = page.locator("header");
    await expect(header.getByText(TAG_A).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(header.getByText(TAG_B).first()).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/kbi-07-detail-multi-tags.png",
    });
  });

  // ── Chat UI: model selector and input ──────────────────────────────────
  test("chat UI: model selector and rich input are present", async ({
    page,
  }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    // Create a conversation if needed
    const newConvButton = page.getByRole("button", {
      name: /new conversation/i,
    });
    if (await newConvButton.isVisible()) {
      await newConvButton.click();
    } else {
      await page.getByRole("button", { name: /^new$/i }).click();
    }
    await page.waitForTimeout(1000);

    // The new input should have the updated placeholder
    await expect(
      page.getByPlaceholder("Ask a question about your knowledge base..."),
    ).toBeVisible({ timeout: 5000 });

    // Model selector should be visible in the footer area
    await expect(page.getByText("GPT-4o").first()).toBeVisible({
      timeout: 5000,
    });

    // Keyboard hints should be visible
    await expect(
      page.getByText("Enter to send"),
    ).toBeVisible({ timeout: 5000 });

    // Attach button should be visible (Paperclip icon button)
    const attachBtn = page.locator('button[title="Attach files"]');
    await expect(attachBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-08-chat-input-ui.png",
    });
  });

  // ── Chat UI: model selector dropdown works ─────────────────────────────
  test("chat UI: can open model selector and see model options", async ({
    page,
  }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    // Ensure we have a conversation
    const newConvButton = page.getByRole("button", {
      name: /new conversation/i,
    });
    if (await newConvButton.isVisible()) {
      await newConvButton.click();
      await page.waitForTimeout(1000);
    }

    // Click the model selector button
    await page.getByText("GPT-4o").first().click();
    await page.waitForTimeout(300);

    // Should show model options
    await expect(
      page.getByRole("menuitem", { name: /claude sonnet 4/i }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("menuitem", { name: /gemini 2\.0 flash/i }),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-09-model-dropdown.png",
    });

    // Select a different model
    await page
      .getByRole("menuitem", { name: /claude sonnet 4/i })
      .click();
    await page.waitForTimeout(300);

    // Verify the selector shows the new model
    await expect(
      page.getByText("Claude Sonnet 4").first(),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-10-model-selected.png",
    });
  });

  // ── Chat UI: message styling ───────────────────────────────────────────
  test("chat messages: user sends message and sees styled response area", async ({
    page,
  }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    // Ensure conversation
    const newConvButton = page.getByRole("button", {
      name: /new conversation/i,
    });
    if (await newConvButton.isVisible()) {
      await newConvButton.click();
      await page.waitForTimeout(1000);
    }

    // Type a message
    const textarea = page.getByPlaceholder(
      "Ask a question about your knowledge base...",
    );
    await textarea.fill("What topics does this knowledge base cover?");

    // Send button should be enabled
    const sendBtn = page.locator(
      'button[type="submit"]:not([disabled])',
    );
    await expect(sendBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-11-message-typed.png",
    });

    // Send the message
    await sendBtn.click();
    await page.waitForTimeout(1000);

    // User message should appear with "You" label
    await expect(page.getByText("You").first()).toBeVisible({
      timeout: 5000,
    });

    // Streaming indicator or assistant response should appear
    // (may show "Thinking..." or "Assistant" label)
    const assistantLabel = page.getByText("Assistant");
    const thinkingLabel = page.getByText("Thinking...");
    await expect(
      assistantLabel.or(thinkingLabel).first(),
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-12-message-sent.png",
    });
  });

  // ── Wiki: graph toggle button visible ──────────────────────────────────
  test("wiki tab: graph view toggle is present", async ({ page }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    await page.getByRole("tab", { name: "Wiki" }).click();
    await page.waitForTimeout(1000);

    // The graph toggle button should be visible in the sidebar header
    // It's a button with title "Graph view" containing a Network icon
    const graphBtn = page.locator('button[title="Graph view"]');
    await expect(graphBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-13-wiki-graph-toggle.png",
    });
  });

  // ── Wiki: switch to graph view and back ────────────────────────────────
  test("wiki tab: can switch to graph view and back to list", async ({
    page,
  }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    await page.getByRole("tab", { name: "Wiki" }).click();
    await page.waitForTimeout(1000);

    // Click graph view toggle
    await page.locator('button[title="Graph view"]').click();
    await page.waitForTimeout(1000);

    // Should now see "Graph View" header
    await expect(page.getByText("Graph View")).toBeVisible({
      timeout: 5000,
    });

    // The "List" button should be visible
    await expect(
      page.getByRole("button", { name: /list/i }),
    ).toBeVisible({ timeout: 5000 });

    // Page/link stats or empty state should be visible
    const stats = page.getByText(/\d+ pages/);
    const emptyMsg = page.getByText("No wiki pages yet");
    await expect(stats.or(emptyMsg).first()).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/kbi-14-graph-view.png",
    });

    // Switch back to list view
    await page.getByRole("button", { name: /list/i }).click();
    await page.waitForTimeout(500);

    // Should see "Pages" heading in the sidebar again
    await expect(page.getByText("Pages").first()).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/kbi-15-back-to-list.png",
    });
  });

  // ── Sources tab shows file from both tags ──────────────────────────────
  test("sources tab shows files from linked tags", async ({ page }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    await page.getByRole("tab", { name: "Sources" }).click();
    await page.waitForTimeout(1000);

    // Our tagged file should appear
    await expect(page.getByText(SOURCE_FILE)).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/kbi-16-sources.png",
    });
  });

  // ── Cleanup: delete KB ─────────────────────────────────────────────────
  test("cleanup: delete the KB", async ({ page }) => {
    await loginAs(page);
    await navigateToKBDetail(page);

    await page.getByRole("tab", { name: "Settings" }).click();
    await page.waitForTimeout(1000);

    await page
      .getByRole("button", { name: /delete knowledge base/i })
      .click();
    await page.waitForTimeout(500);

    await page
      .locator('[data-slot="alert-dialog-content"]')
      .getByRole("button", { name: /^delete$/i })
      .click();

    await expect(page).toHaveURL(/\/knowledge-bases$/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(
      page.getByText("No knowledge bases yet"),
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "e2e/screenshots/kbi-17-cleanup.png",
    });
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────

async function loginAs(page: Page) {
  await dismissKBAnnouncementViaStorage(page);
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
  await page.getByPlaceholder("Enter password").fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/w\//, { timeout: 15000 });
  await page.waitForTimeout(1000);
}

async function dismissKBAnnouncementViaStorage(page: Page) {
  await page.addInitScript(() => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      if (key.startsWith("locker:kb-announcement-dismissed")) return "1";
      return orig.call(this, key);
    };
  });
}

async function navigateToKBDetail(page: Page) {
  await page.getByText("Knowledge Base", { exact: true }).click();
  await page.waitForTimeout(1000);
  // Use locator with hasText — the card is an <a> wrapping the KB name
  await page.locator("a.rounded-lg", { hasText: KB_NAME }).first().click();
  await page.waitForTimeout(1000);
}

async function openFileContextMenu(page: Page, fileName: string) {
  const row = page.locator("div.grid", { hasText: fileName }).first();
  await row.hover();
  await page.waitForTimeout(300);
  const menuBtn = row.locator("button").last();
  await menuBtn.click({ force: true });
  await page.waitForTimeout(300);
}
