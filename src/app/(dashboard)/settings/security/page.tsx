import { redirect } from "next/navigation";

// Security now lives as a section of the profile page; kept as a redirect so
// old links still land there.
export default function SecurityPage() {
  redirect("/settings/profile#seguranca");
}
