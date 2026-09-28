import { redirect } from "next/navigation";

// The old home was just the "Ativos" tab of /projects; kept as a redirect so
// bookmarks and old links still land somewhere.
export default function DashboardPage() {
  redirect("/projects");
}
