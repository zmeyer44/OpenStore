import { test, expect, type Page } from "@playwright/test";

const TEST_USER = {
  name: "Share Link Test User",
  email: `share-link-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

let workspaceSlug = "";

test.describe.serial("AI chat: upload documents and generate share links", () => {
  // ── Setup: register, onboard, upload a file ────────────────────────────
  test("setup: register, onboard, and upload a test file", async ({
    page,
  }) => {
    await dismissKBAnnouncementViaStorage(page);

    // Register
    await page.goto("/register");
    await page.getByPlaceholder("Your name").fill(TEST_USER.name);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Choose a password").fill(TEST_USER.password);
    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForURL("/onboarding", { timeout: 15000 });

    // Onboard — create workspace
    await page.getByPlaceholder("e.g. Acme Inc").fill("Share Link Test WS");
    await page.getByRole("button", { name: /create workspace/i }).click();
    await page.waitForURL(/\/w\//, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Capture workspace slug
    const url = page.url();
    const match = url.match(/\/w\/([^/]+)/);
    workspaceSlug = match?.[1] ?? "";
    expect(workspaceSlug).toBeTruthy();

    // Upload a test file via the file explorer so we have a file to share
    await page
      .getByRole("button", { name: /^upload$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const fileInput = page.locator(
      '[data-slot="dialog-content"] input[type="file"]',
    );
    await fileInput.setInputFiles({
      name: "share-test-doc.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("This is a test document for share link testing."),
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /upload 1 file/i }).click();
    await page.waitForTimeout(3000);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "e2e/screenshots/share-01-setup-complete.png",
    });
  });

  // ── Navigate to AI chat and attach a file ──────────────────────────────
  test("attach a file in chat and verify preview appears", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto(`/w/${workspaceSlug}/chat`);
    await page.waitForTimeout(1000);

    // Attach a file via the hidden file input
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "chat-upload.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("File attached in AI chat for share link creation."),
    });
    await page.waitForTimeout(500);

    // Attachment preview should appear with the filename
    await expect(page.getByText("chat-upload.txt")).toBeVisible({
      timeout: 5000,
    });

    await page.screenshot({
      path: "e2e/screenshots/share-02-file-attached.png",
    });
  });

  // ── Send a plain text message in chat ────────────────────────────────
  test("send a plain message in chat and see it rendered", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto(`/w/${workspaceSlug}/chat`);
    await page.waitForTimeout(1000);

    // Type a message and send (no attachment — tests basic send flow)
    const textarea = page.getByPlaceholder("Reply...");
    await textarea.fill("Create a share link for my document");
    await textarea.press("Enter");
    await page.waitForTimeout(3000);

    // The user message should appear in the chat
    await expect(
      page.getByText("Create a share link for my document").first(),
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "e2e/screenshots/share-03-message-sent.png",
    });

    // Wait for AI response (may fail with 502 if no API key, that's fine)
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: "e2e/screenshots/share-03b-after-response.png",
    });
  });

  // ── tRPC: create a share link for a file ───────────────────────────────
  test("tRPC: create share link for a file succeeds", async ({ page }) => {
    await loginAs(page);

    // First, list files via tRPC query (GET with input query param)
    const fileId = await page.evaluate(async ({ slug }) => {
      const input = encodeURIComponent(
        JSON.stringify({ json: { folderId: null } }),
      );
      const res = await fetch(`/api/trpc/files.list?input=${input}`, {
        headers: { "x-workspace-slug": slug },
      });
      const data = await res.json();
      // files.list returns { items, total, page, pageSize, totalPages }
      const items = data?.result?.data?.json?.items ?? [];
      return items[0]?.id ?? null;
    }, { slug: workspaceSlug });

    expect(fileId).toBeTruthy();

    // Create a share link via tRPC mutation (POST)
    const shareResult = await page.evaluate(
      async ({ slug, fileId }) => {
        const res = await fetch(`/api/trpc/shares.create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-slug": slug,
          },
          body: JSON.stringify({
            json: {
              fileId,
              access: "view",
            },
          }),
        });
        const data = await res.json();
        return {
          status: res.status,
          ok: res.ok,
          token: data?.result?.data?.json?.token ?? null,
        };
      },
      { slug: workspaceSlug, fileId },
    );

    expect(shareResult.ok).toBeTruthy();
    expect(shareResult.token).toBeTruthy();

    await page.screenshot({
      path: "e2e/screenshots/share-04-trpc-share-link-created.png",
    });
  });

  // ── tRPC: list share links shows the created link ──────────────────────
  test("tRPC: list share links returns the created link", async ({ page }) => {
    await loginAs(page);

    const listResult = await page.evaluate(async ({ slug }) => {
      const res = await fetch(`/api/trpc/shares.list`, {
        headers: { "x-workspace-slug": slug },
      });
      const data = await res.json();
      const links = data?.result?.data?.json ?? [];
      return {
        status: res.status,
        count: links.length,
        hasFileLink: links.some(
          (l: any) => l.fileId !== null && l.isActive,
        ),
      };
    }, { slug: workspaceSlug });

    expect(listResult.status).toBe(200);
    expect(listResult.count).toBeGreaterThanOrEqual(1);
    expect(listResult.hasFileLink).toBe(true);

    await page.screenshot({
      path: "e2e/screenshots/share-05-trpc-list-share-links.png",
    });
  });

  // ── AI chat API: validates message structure ───────────────────────────
  test("AI chat API: accepts well-formed share link request", async ({
    page,
  }) => {
    await loginAs(page);

    // Create a conversation
    const convId = await page.evaluate(async ({ slug }) => {
      const res = await fetch(`/api/trpc/assistant.createConversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-slug": slug,
        },
        body: JSON.stringify({ json: {} }),
      });
      const data = await res.json();
      return data?.result?.data?.json?.id ?? null;
    }, { slug: workspaceSlug });

    expect(convId).toBeTruthy();

    // Call the chat API — verifies auth and validation pass
    const chatResult = await page.evaluate(
      async ({ slug, conversationId }) => {
        const res = await fetch(`/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-slug": slug,
          },
          body: JSON.stringify({
            conversationId,
            messages: [
              {
                id: "share-test-msg-1",
                role: "user",
                parts: [
                  {
                    type: "text",
                    text: 'Create a share link for my file "share-test-doc.txt"',
                  },
                ],
              },
            ],
          }),
        });
        return { status: res.status };
      },
      { slug: workspaceSlug, conversationId: convId },
    );

    // 200 = AI responded (has API key), 502 = no AI key configured
    // Should NOT be 400, 401, 403, 404
    expect([200, 502]).toContain(chatResult.status);

    await page.screenshot({
      path: "e2e/screenshots/share-06-chat-api-validation.png",
    });
  });

  // ── Verify uploaded file appears in file explorer ──────────────────────
  test("file uploaded during setup appears in file explorer", async ({
    page,
  }) => {
    await loginAs(page);

    // Go back to the file explorer (workspace root)
    await page.goto(`/w/${workspaceSlug}`);
    await page.waitForTimeout(2000);

    // The "share-test-doc.txt" from setup should be visible
    await expect(
      page.getByText("share-test-doc.txt").first(),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/share-07-file-in-explorer.png",
    });
  });

  // ── Share link via context menu (alternative flow) ─────────────────────
  test("create share link via file context menu", async ({ page }) => {
    await loginAs(page);
    await page.goto(`/w/${workspaceSlug}`);
    await page.waitForTimeout(2000);

    // Open context menu on the test file
    await openFileContextMenu(page, "share-test-doc.txt");

    await page.screenshot({
      path: "e2e/screenshots/share-08-context-menu.png",
    });

    // Look for a share option in the context menu
    const shareItem = page.getByRole("menuitem", { name: /share/i });
    const hasShareOption = (await shareItem.count()) > 0;

    if (hasShareOption) {
      await shareItem.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: "e2e/screenshots/share-09-share-dialog.png",
      });

      // Close any dialog that opened
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    } else {
      // If no share menu item, close the context menu
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  });

  // ── tRPC: revoke a share link ──────────────────────────────────────────
  test("tRPC: revoke a share link disables it", async ({ page }) => {
    await loginAs(page);

    // List share links to get one to revoke
    const linkId = await page.evaluate(async ({ slug }) => {
      const res = await fetch(`/api/trpc/shares.list`, {
        headers: { "x-workspace-slug": slug },
      });
      const data = await res.json();
      const links = data?.result?.data?.json ?? [];
      const activeLink = links.find((l: any) => l.isActive);
      return activeLink?.id ?? null;
    }, { slug: workspaceSlug });

    expect(linkId).toBeTruthy();

    // Revoke the share link (tRPC input field is `id`, not `shareLinkId`)
    const revokeResult = await page.evaluate(
      async ({ slug, linkId }) => {
        const res = await fetch(`/api/trpc/shares.revoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-slug": slug,
          },
          body: JSON.stringify({
            json: { id: linkId },
          }),
        });
        return { status: res.status, ok: res.ok };
      },
      { slug: workspaceSlug, linkId },
    );

    expect(revokeResult.ok).toBeTruthy();

    // Verify the link is now inactive
    const verifyResult = await page.evaluate(async ({ slug, linkId }) => {
      const res = await fetch(`/api/trpc/shares.list`, {
        headers: { "x-workspace-slug": slug },
      });
      const data = await res.json();
      const links = data?.result?.data?.json ?? [];
      const revokedLink = links.find((l: any) => l.id === linkId);
      return { isActive: revokedLink?.isActive ?? null };
    }, { slug: workspaceSlug, linkId });

    expect(verifyResult.isActive).toBe(false);

    await page.screenshot({
      path: "e2e/screenshots/share-10-link-revoked.png",
    });
  });

  // ── Chat input: multiple attachments ───────────────────────────────────
  test("attach multiple files and verify all previews appear", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto(`/w/${workspaceSlug}/chat`);
    await page.waitForTimeout(1000);

    const fileInput = page.locator("input[type='file']");

    // Attach multiple files at once
    await fileInput.setInputFiles([
      {
        name: "doc-one.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("PDF content 1"),
      },
      {
        name: "doc-two.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Text content 2"),
      },
    ]);
    await page.waitForTimeout(500);

    // Both attachment previews should appear
    await expect(page.getByText("doc-one.pdf")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("doc-two.txt")).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/share-11-multiple-attachments.png",
    });

    // Remove one attachment
    const firstAttachment = page
      .locator("span", { hasText: "doc-one.pdf" })
      .locator("..");
    await firstAttachment.locator("button").click();
    await page.waitForTimeout(500);

    // First should be gone, second still visible
    await expect(
      page.locator("span", { hasText: "doc-one.pdf" }),
    ).not.toBeVisible();
    await expect(page.getByText("doc-two.txt")).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/share-12-one-attachment-removed.png",
    });
  });

  // ── Conversation with share request persists ───────────────────────────
  test("conversation with share request persists across page load", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto(`/w/${workspaceSlug}/chat`);
    await page.waitForTimeout(2000);

    // There should be at least one conversation from earlier tests
    const conversations = page.locator("div.group\\/item");
    const count = await conversations.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Click the first conversation
    await conversations.first().click();
    await page.waitForTimeout(1000);

    // The message from our earlier test should still be visible
    await expect(
      page.getByText("Create a share link for my document").first(),
    ).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "e2e/screenshots/share-13-conversation-persisted.png",
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
  // Login may redirect to /home or /w/ depending on routing
  await page.waitForURL(/\/(w\/|home)/, { timeout: 30000 });
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

async function openFileContextMenu(page: Page, fileName: string) {
  const row = page.locator("div.grid", { hasText: fileName }).first();
  await row.hover();
  await page.waitForTimeout(300);
  const menuBtn = row.locator("button").last();
  await menuBtn.click({ force: true });
  await page.waitForTimeout(300);
}
