import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFA]">
      <AppSidebar user={session.user} />
      <div className="flex flex-1 shrink p-2 pl-0 overflow-x-hidden">
        <main className="flex-1 overflow-auto rounded-lg border bg-muted">
          {children}
        </main>
      </div>
    </div>
  );
}
