import type { Metadata } from "next";

// Same rules as the shared dashboard pages: the token in the URL is the whole
// authorization, so keep it out of search indexes and Referer headers.
export const metadata: Metadata = {
  title: "Formulário",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Bare on purpose — whoever fills a form usually has no TaskFlow account.
export default function PublicFormsLayout({ children }: LayoutProps<"/forms">) {
  return <div className="min-h-screen bg-muted/30">{children}</div>;
}
