import { RequireAuth } from "@/features/auth/components/require-auth";
import { CurrentWorkspaceProvider } from "@/features/workspaces/context/current-workspace-context";
import { SyncProvider } from "@/features/sync/context/sync-context";
import { RealtimeConnector } from "@/features/realtime/components/realtime-connector";
import { TutorialProvider } from "@/features/tutorial/context/tutorial-context";
import { TutorialTour } from "@/features/tutorial/components/tutorial-tour";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Topbar } from "@/components/layout/topbar";
import { AssistantChatProvider } from "@/features/assistant/context/assistant-chat-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <CurrentWorkspaceProvider>
        <SyncProvider>
          <RealtimeConnector />
          <TutorialProvider>
            <AssistantChatProvider>
              <SidebarProvider>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar />
                    <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                      {/* Caps line length on wide monitors. Boards and dashboard
                          grids opt out by rendering `data-page-width="full"`. */}
                      <div className="mx-auto w-full max-w-7xl has-data-[page-width=full]:max-w-none">
                        {children}
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </AssistantChatProvider>
            <TutorialTour />
          </TutorialProvider>
        </SyncProvider>
      </CurrentWorkspaceProvider>
    </RequireAuth>
  );
}
