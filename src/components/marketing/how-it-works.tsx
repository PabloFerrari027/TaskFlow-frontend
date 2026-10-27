const STEPS = [
  {
    step: "01",
    title: "Crie sua conta",
    description:
      "Com e-mail ou com Google. Leva um minuto.",
  },
  {
    step: "02",
    title: "Conte um pouco sobre você",
    description:
      "Umas perguntas rápidas para o assistente entender o que você quer organizar. Dá para pular.",
  },
  {
    step: "03",
    title: "Fale o que precisa",
    description:
      "“Me lembra de pagar a luz todo dia 10.” O assistente guarda e avisa na hora.",
  },
  {
    step: "04",
    title: "Veja tudo num lugar só",
    description:
      "A tela inicial mostra o que vence hoje, o que atrasou e os seus lembretes.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Como funciona
        </h2>
        <p className="mt-3 text-muted-foreground">
          Do cadastro ao primeiro lembrete, sem manual.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item) => (
          <div key={item.step} className="relative pl-4">
            <span className="text-4xl font-bold text-primary/20">
              {item.step}
            </span>
            <h3 className="mt-2 text-base font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
