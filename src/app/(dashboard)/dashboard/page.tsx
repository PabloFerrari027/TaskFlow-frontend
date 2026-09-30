import { redirect } from "next/navigation";

// The old home route; kept as a redirect to Início so bookmarks and old links
// still land somewhere.
export default function DashboardPage() {
  redirect("/home");
}
