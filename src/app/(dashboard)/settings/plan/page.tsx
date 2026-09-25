import { redirect } from "next/navigation";

// Moved to /settings/billing; kept so old links and bookmarks still work.
export default function PlanPage() {
  redirect("/settings/billing");
}
