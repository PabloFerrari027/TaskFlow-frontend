"use client";

import { useParams } from "next/navigation";
import { PublicIntakeFormPage } from "@/features/intake-forms/components/public-intake-form";

export default function PublicIntakeFormRoute() {
  const { token } = useParams<{ token: string }>();
  return <PublicIntakeFormPage token={token} />;
}
