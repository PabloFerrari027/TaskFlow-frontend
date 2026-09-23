import Link from "next/link";
import { BookOpen } from "lucide-react";

// A visible pointer to the rich, searchable guide in /tutorial — used instead
// of cramming detailed documentation into a tab of the feature itself, which
// hides it from the lay users the tutorial is written for.
export function TutorialGuideLink({
  guideId,
  label = "Saiba mais",
}: {
  guideId: string;
  label?: string;
}) {
  return (
    <Link
      href={`/tutorial#${guideId}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <BookOpen className="size-4" />
      {label}
    </Link>
  );
}
