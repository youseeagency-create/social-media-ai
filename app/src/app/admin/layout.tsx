import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/workspace");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-background/80 px-6 py-4 backdrop-blur-xl">
        <h1 className="text-sm font-semibold">Workspaces</h1>
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
