import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  dev: {
    // Web app owns 3000; move WXT's dev server.
    server: { port: 3101 },
  },
  manifest: () => {
    const webHost =
      process.env.WXT_PUBLIC_LOCKER_WEB_HOST ?? "http://localhost:3000";
    return {
      name: "Locker",
      description: "Pick files from your Locker workspace anywhere on the web.",
      permissions: ["storage", "activeTab", "scripting", "tabs"],
      // Need broad host access so the file-input intercept content script can
      // run on any page, and the SW can hit the Locker API regardless of host.
      host_permissions: ["<all_urls>"],
      action: { default_popup: "popup.html", default_title: "Locker" },
      web_accessible_resources: [
        {
          // The /extension-signin page on the web host bounces users back to
          // auth-complete.html. MV3 needs that bounce target declared.
          resources: ["auth-complete.html"],
          matches: [`${webHost}/*`, "http://localhost:3000/*"],
        },
      ],
    };
  },
});
