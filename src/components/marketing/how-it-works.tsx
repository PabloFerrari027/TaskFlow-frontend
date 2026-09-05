const STEPS = [
  {
    step: "01",
    title: "Crie seu workspace",
    description:
      "Cadastre-se, confirme com o código de segurança enviado por e-mail e crie o workspace da sua equipe.",
  },
  {
    step: "02",
    title: "Monte seus projetos",
    description:
      "Adicione projetos, convide colaboradores por e-mail e defina o papel de cada um.",
  },
  {
    step: "03",
    title: "Divida em tarefas",
    description:
      "Crie tarefas, atribua responsáveis, quebre em subtarefas e anexe os arquivos necessários.",
  },
  {
    step: "04",
    title: "Acompanhe o progresso",
    description:
      "Mude o status conforme o trabalho avança e use campos personalizados para o que for específico do seu projeto.",
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
          Do cadastro ao primeiro projeto rodando, em quatro passos.
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
