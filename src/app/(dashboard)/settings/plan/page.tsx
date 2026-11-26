import { redirect } from "next/navigation";

// "Plano" became "Plano e cobrança": one page for plan + subscription. The
// query string is kept so an old Stripe return URL (`?checkout=success`)
// still lands on the page that handles it.
export default async function PlanPage(props: PageProps<"/settings/plan">) {
  const searchParams = await props.searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item);
    }
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  redirect(`/settings/billing${suffix}`);
}
