import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Footer } from "@/components/marketing/footer";
import {
  AI_POINTS,
  BROWSER_STORAGE,
  DATA_CATEGORIES,
  FAQ,
  LAST_UPDATED,
  NOT_DONE,
  PRIVACY_CONTACT_EMAIL,
  RIGHTS,
  SECTIONS,
  SECURITY_POINTS,
  SHARING_POINTS,
  SUMMARY_POINTS,
  USAGE_PURPOSES,
} from "./content";

export const metadata: Metadata = {
  title: "Privacidade e perguntas frequentes",
  description:
    "Política de privacidade do TaskFlow, como usamos os dados dos clientes e respostas para as dúvidas mais comuns.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="border-b border-border/60 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Privacidade e perguntas frequentes
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Aqui explicamos, de forma direta, quais dados coletamos, por que os usamos e como
              você pode controlá-los.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Última atualização: {LAST_UPDATED}
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[14rem_1fr] lg:gap-14">
          <aside className="hidden lg:block">
            <nav aria-label="Nesta página" className="sticky top-24 space-y-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nesta página
              </p>
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 max-w-3xl space-y-14">
            <Section id="resumo" title="Resumo">
              <p className="text-sm leading-relaxed text-muted-foreground">
                O TaskFlow é uma plataforma de gestão de projetos e tarefas. Esta política
                descreve como tratamos dados pessoais em conformidade com a Lei Geral de Proteção
                de Dados (Lei nº 13.709/2018 — LGPD).
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {SUMMARY_POINTS.map((point) => (
                  <div
                    key={point.title}
                    className="rounded-xl border border-border bg-card p-4 text-card-foreground"
                  >
                    <h3 className="text-sm font-semibold">{point.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="dados-coletados" title="Dados que coletamos">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Coletamos apenas informações ligadas ao funcionamento do serviço. Cada categoria
                abaixo tem uma finalidade específica.
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Categoria</TableHead>
                      <TableHead>O que é</TableHead>
                      <TableHead>Para quê</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DATA_CATEGORIES.map((row) => (
                      <TableRow key={row.category} className="align-top">
                        <TableCell className="whitespace-normal font-medium">
                          {row.category}
                        </TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {row.data}
                        </TableCell>
                        <TableCell className="whitespace-normal text-muted-foreground">
                          {row.purpose}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>

            <Section id="como-usamos" title="Como usamos seus dados">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Usamos os dados dos nossos clientes somente para as finalidades abaixo:
              </p>
              <BulletList items={USAGE_PURPOSES} />
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">O que não fazemos</p>
                <ul className="mt-3 space-y-2">
                  {NOT_DONE.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                As bases legais que utilizamos são a execução do contrato de uso do serviço, o
                cumprimento de obrigação legal, o legítimo interesse (segurança e prevenção a
                fraudes) e, quando necessário, o seu consentimento.
              </p>
            </Section>

            <Section id="assistente-ia" title="Assistente de IA e análises em linguagem natural">
              <BulletList items={AI_POINTS} />
            </Section>

            <Section id="compartilhamento" title="Com quem compartilhamos">
              <div className="space-y-3">
                {SHARING_POINTS.map((point) => (
                  <div key={point.title} className="text-sm leading-relaxed">
                    <span className="font-medium text-foreground">{point.title}. </span>
                    <span className="text-muted-foreground">{point.description}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="navegador" title="Armazenamento no navegador">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Não usamos cookies de publicidade nem rastreadores de terceiros. O aplicativo
                utiliza o armazenamento local do seu navegador apenas para o que é necessário ao
                funcionamento:
              </p>
              <div className="divide-y divide-border rounded-xl border border-border">
                {BROWSER_STORAGE.map((item) => (
                  <div key={item.name} className="p-4">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Você pode apagar esses dados a qualquer momento limpando os dados do site no
                navegador; isso encerrará sua sessão neste dispositivo.
              </p>
            </Section>

            <Section id="seguranca" title="Segurança">
              <ul className="space-y-2">
                {SECURITY_POINTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="retencao" title="Retenção e exclusão">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Mantemos seus dados enquanto sua conta estiver ativa e pelo tempo necessário para
                cumprir obrigações legais. Depois disso, eles são eliminados ou anonimizados, salvo
                quando a lei exigir a sua conservação. Para pedir a exclusão da conta, use o
                contato indicado abaixo.
              </p>
            </Section>

            <Section id="direitos" title="Seus direitos">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Como titular de dados, a LGPD garante a você o direito de:
              </p>
              <BulletList items={RIGHTS} />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Para exercê-los, escreva para{" "}
                <a
                  href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                  className="font-medium text-primary hover:underline"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>

            <Section id="faq" title="Perguntas frequentes">
              <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
                {FAQ.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Section>

            <Section id="contato" title="Contato e alterações">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Fale com a gente
                em{" "}
                <a
                  href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                  className="font-medium text-primary hover:underline"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>
                . Podemos atualizar esta página para refletir mudanças no produto ou na lei; a data
                de atualização no topo sempre indica a versão em vigor.
              </p>
            </Section>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}
