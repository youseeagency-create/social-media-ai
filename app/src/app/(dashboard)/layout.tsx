import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { PipelineProvider } from "@/context/pipeline-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/workspace");

  return (
    <PipelineProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto min-h-screen">
          <TopBar />
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </SidebarProvider>
    </PipelineProvider>
  );
}
