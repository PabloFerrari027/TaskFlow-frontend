"use client";

import { useParams } from "next/navigation";
import { SharedPageViewer } from "@/features/dashboard-pages/public-viewer/page";

export default function GuestDashboardPage() {
  const { token } = useParams<{ token: string }>();
  return <SharedPageViewer kind="guest" token={token} />;
}
