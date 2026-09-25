import type { Metadata } from "next";

// Public and guest links carry their whole authorization in the URL: keep
// them out of search indexes, and never leak them through a Referer header.
export const metadata: Metadata = {
  title: "Página compartilhada",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Deliberately bare — none of the signed-in shell (sidebar, topbar,
// workspace menu, links back into the app) exists under /pages.
export default function SharedPagesLayout({ children }: LayoutProps<"/pages">) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
