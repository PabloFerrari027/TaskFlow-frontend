import { redirect } from "next/navigation";

// Sessions now live as a section of the security page; kept as a redirect so
// old links still land there.
export default function SessionsPage() {
  redirect("/settings/security#sessoes");
}
