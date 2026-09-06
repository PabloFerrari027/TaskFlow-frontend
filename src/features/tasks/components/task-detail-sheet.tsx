"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TaskDetailView } from "@/features/tasks/components/task-detail-view";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";

// Asana-style side panel: opens over whatever page is showing, driven by the
// `taskId` search param, with a shortcut to jump to the task's own full page.
export function TaskDetailSheet({ projectId }: { projectId: string }) {
  const { openTaskId, closeTask } = useTaskPanel();

  return (
    <Sheet open={Boolean(openTaskId)} onOpenChange={(open) => !open && closeTask()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        {openTaskId ? (
          <>
            <SheetHeader className="flex-row items-center justify-between gap-2 pr-12">
              <SheetTitle className="sr-only">Detalhes da tarefa</SheetTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${projectId}/tasks/${openTaskId}`} onClick={closeTask}>
                  <Maximize2 /> Tela cheia
                </Link>
              </Button>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <TaskDetailView projectId={projectId} taskId={openTaskId} layout="stacked" />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
