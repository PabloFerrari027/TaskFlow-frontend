import { RequireAuth } from "@/features/auth/components/require-auth";
import { CurrentWorkspaceProvider } from "@/features/workspaces/context/current-workspace-context";
import { SyncProvider } from "@/features/sync/context/sync-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <CurrentWorkspaceProvider>
        <SyncProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                {children}
              </main>
            </div>
          </div>
        </SyncProvider>
      </CurrentWorkspaceProvider>
    </RequireAuth>
  );
}
