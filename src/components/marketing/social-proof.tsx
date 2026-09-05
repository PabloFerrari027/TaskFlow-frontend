import {
  ShieldCheck,
  KeyRound,
  Users,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Autenticação em duas etapas" },
  { icon: KeyRound, label: "Login com Google" },
  { icon: Users, label: "Papéis e permissões por workspace" },
  { icon: Layers, label: "Múltiplos workspaces e projetos" },
  { icon: SlidersHorizontal, label: "Campos personalizados por projeto" },
];

export function SocialProof() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Construído com os fundamentos que uma equipe séria precisa
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
