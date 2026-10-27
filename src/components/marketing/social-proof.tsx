import {
  ShieldCheck,
  KeyRound,
  Users,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Entrada segura com código por e-mail" },
  { icon: KeyRound, label: "Login com Google" },
  { icon: Users, label: "Pastas divididas com a família" },
  { icon: Layers, label: "Modelos prontos para começar" },
  { icon: SlidersHorizontal, label: "Lembretes por texto ou áudio" },
];

export function SocialProof() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Feito para o dia a dia
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {TRUST_POINTS.map((point) => (
            <div
              key={point.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <point.icon className="size-4 text-primary" />
              {point.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
