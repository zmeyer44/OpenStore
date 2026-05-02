import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

type Props = {
  searchParams: Promise<{ return?: string }>;
};

function isExtensionReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "chrome-extension:" ||
      parsed.protocol === "moz-extension:"
    );
  } catch {
    return false;
  }
}

export default async function ExtensionSigninPage({ searchParams }: Props) {
  const { return: returnUrl } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!returnUrl || !isExtensionReturnUrl(returnUrl)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="rounded-lg border bg-card p-6 shadow-sm w-full max-w-sm text-sm">
          Invalid extension return URL.
        </div>
      </div>
    );
  }

  if (!session) {
    const next = `/extension-signin?return=${encodeURIComponent(returnUrl)}`;
    redirect(`/login?redirect=${encodeURIComponent(next)}`);
  }

  const completeUrl = new URL(returnUrl);
  completeUrl.searchParams.set("ok", "1");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="rounded-lg border bg-card p-6 shadow-sm w-full max-w-sm text-center space-y-3">
        <h1 className="text-lg font-semibold">Connecting Locker extension</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.user.email}. Redirecting back to the extension…
        </p>
        <noscript>
          <a
            className="text-primary underline text-sm"
            href={completeUrl.toString()}
          >
            Continue
          </a>
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace(${JSON.stringify(completeUrl.toString())});`,
          }}
        />
      </div>
    </div>
  );
}
