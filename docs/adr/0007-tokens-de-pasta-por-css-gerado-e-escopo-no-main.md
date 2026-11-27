# 0007. Tokens de pasta por CSS gerado e escopo no `<main>`

- **Status:** Proposto
- **Data:** 2026-11-27
- **Módulo:** folders-aparencia
- **PR:** feat/temas-pasta-front

## Contexto

Cada pasta pode ter paleta, fonte e peso próprios, escolhidos num catálogo fechado e versionado (9 paletas, 6 fontes, 3 pesos). O tema precisa valer só dentro da pasta (sidebar, topbar, toasts e tour continuam no padrão), sem flash do tema padrão ao trocar de pasta e sem esperar uma chamada de catálogo no primeiro paint.

## Decisão

- **CSS gerado do catálogo (D9).** O front guarda uma cópia do JSON do catálogo (`src/lib/appearance/folder-appearance-catalog.json`). `npm run gen:appearance` gera `src/app/folder-appearance.css`, importado por `globals.css`. Há uma regra por valor (`[data-folder-palette="azul"]`, `.dark [data-folder-palette="azul"]`, `[data-folder-font=...]`, `[data-folder-weight=...]`). Testes conferem contraste AA contra a cópia do JSON.
- **Escopo no `<main>` (D4, D17).** O `<main>` do dashboard (`ThemedMain`) recebe `data-folder-palette/font/weight` só para eixos não padrão e o fundo vem da regra gerada `[data-folder-palette]:not([data-folder-portal-host]) { background-color: var(--background); color: var(--foreground) }`, para que a troca de neutros apareça de forma coerente. Sidebar e topbar ficam fora.
- **Host de portal.** Diálogos, menus e tooltips abrem em `body`, fora do `<main>`. `ThemedMain` monta um segundo elemento no fim do `<body>` (`data-folder-portal-host`) com os mesmos atributos, e os primitivos de `components/ui` usam `useFolderPortalContainer()` como container. Fora do `<main>` o container é `undefined` e tudo continua indo para o `body`.
- **Preview (D5).** Um único painel no modo atual, com o botão "Ver no modo escuro/claro".
- **Opt-out local.** A pessoa pode ignorar a aparência de pasta neste navegador (`taskflow.ignoreFolderAppearance` no `localStorage`). O item de menu só aparece na topbar do dashboard e com a flag do workspace ligada. A bolinha de cor da pasta ignora o opt-out (ela só identifica). Sem aparência aplicada (flag desligada ou opt-out), não há requisição extra nem pré-carga de fonte: a consulta de flags só roda com `workspaceId` e `document.fonts.load` só dispara quando a aparência é aplicada.

## Alternativas consideradas

- **`style` inline vindo do endpoint:** cada resposta carregaria cores, o front dependeria da API para renderizar e o contraste não seria testável em build.
- **Wrapper sem `<main>` tematizado:** a troca de neutros não cobriria o fundo da área, e o resultado ficaria com faixas no tema padrão.
- **Dois painéis de preview (claro e escuro lado a lado):** ocupa a tela e duplica a regra de tema; um painel com alternância basta.

## Consequências

- **Positivas:** sem requisição extra nem flash; o contraste é verificável em teste; o escopo é uma única superfície, fácil de auditar.
- **Negativas / trade-offs:** o CSS gerado (cerca de 15 KB) vai para todas as páginas; mudar o catálogo exige regenerar o CSS e conferir o diff; primitivos novos que usem portal precisam usar `useFolderPortalContainer`; se a aparência passa de ou para `default` com um overlay aberto, o host de portal entra ou sai e o Radix remonta o conteúdo (raro e conhecido); a topbar translúcida deixa passar um leve tom padrão sobre o conteúdo rolado.
