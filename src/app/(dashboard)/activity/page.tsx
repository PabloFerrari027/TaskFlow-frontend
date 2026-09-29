import { redirect } from "next/navigation";

// Workspace activity now lives in its own section on /workspaces (and each
// project has an Atividade tab). Kept so old links and bookmarks still land.
export default function ActivityRedirect() {
  redirect("/workspaces#atividade");
}
