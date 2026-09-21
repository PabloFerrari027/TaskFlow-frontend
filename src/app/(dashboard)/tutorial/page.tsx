"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuides } from "@/features/tutorial/components/tutorial-guides";
import {
  Glossary,
  RolesMatrix,
} from "@/features/tutorial/components/tutorial-reference";
import { useTutorial } from "@/features/tutorial/context/tutorial-context";

export default function TutorialPage() {
  const { startTour } = useTutorial();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        title="Tutorial"
        description="Guias completos de cada área do TaskFlow. Busque um assunto ou siga na ordem."
        actions={
          <Button variant="outline" onClick={startTour}>
            <PlayCircle /> Refazer tour guiado
          </Button>
        }
      />

      <TutorialGuides />

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Papéis e permissões</h2>
          <p className="text-sm text-muted-foreground">
            O que cada papel do workspace pode fazer.
          </p>
        </div>
        <RolesMatrix />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Glossário</h2>
          <p className="text-sm text-muted-foreground">
            Os termos que você vai encontrar pelo sistema.
          </p>
        </div>
        <Glossary />
      </section>

      <p className="text-sm text-muted-foreground">
        Dúvidas sobre dados e privacidade? Veja{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Privacidade e FAQ
        </Link>
        .
      </p>
    </div>
  );
}
