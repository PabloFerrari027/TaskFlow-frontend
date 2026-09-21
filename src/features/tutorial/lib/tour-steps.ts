export type TourPlacement = "bottom" | "right";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  // Value of the `data-tour` attribute on the element to spotlight. Omitted
  // for steps shown centered on screen (welcome / wrap-up).
  target?: string;
  placement?: TourPlacement;
}

// Only elements of the dashboard shell (topbar + sidebar) are targeted, so the
// tour works the same from any page. Steps whose target isn't on screen (e.g.
// the sidebar on mobile, or hidden by the user) are dropped when the tour
// opens — see `TutorialTour`.
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao TaskFlow!",
    description:
      "Este tour rápido mostra onde ficam as principais áreas do sistema. Leva menos de um minuto e você pode sair a qualquer momento.",
  },
  {
    id: "workspace",
    target: "workspace-switcher",
    placement: "bottom",
    title: "Seu workspace",
    description:
      "Um workspace reúne projetos, tarefas e pessoas de uma equipe. Use este seletor para alternar entre workspaces ou criar um novo.",
  },
  {
    id: "sidebar",
    target: "sidebar",
    placement: "right",
    title: "Menu de navegação",
    description:
      "Daqui você acessa o Dashboard, seus Projetos (onde ficam os quadros de tarefas), as Análises, os Workspaces e as configurações da conta.",
  },
  {
    id: "assistant",
    target: "assistant",
    placement: "bottom",
    title: "Assistente de IA",
    description:
      "Peça ao assistente para consultar ou criar tarefas em linguagem natural. Toda ação de escrita só acontece depois da sua confirmação. Um dono do workspace precisa ativá-lo na aba Assistente.",
  },
  {
    id: "user-menu",
    target: "user-menu",
    placement: "bottom",
    title: "Sua conta",
    description:
      "Aqui você abre o tutorial completo, refaz este tour e sai da conta.",
  },
  {
    id: "done",
    title: "Tudo pronto!",
    description:
      "Para um passo a passo de cada área, abra a página Tutorial no menu lateral. Ela também tem um botão para refazer este tour quando quiser.",
  },
];
