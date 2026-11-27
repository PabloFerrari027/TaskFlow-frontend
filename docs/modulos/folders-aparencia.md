# Módulo folders / aparência da pasta (frontend)

Estado atual. Contrato do backend: `API.md`, seção "Aparência da pasta". Decisões: [ADR 0007](../adr/0007-tokens-de-pasta-por-css-gerado-e-escopo-no-main.md) e [ADR 0006](../adr/0006-aa-do-tema-padrao-e-composicoes.md).

## O que o usuário vê

Dentro de uma pasta, a área principal usa a paleta, a fonte e o peso da pasta (próprios ou herdados do ancestral mais próximo). Sidebar, topbar, toasts, tour e telas fora de `/folders/[folderId]/…` ficam no tema padrão. Diálogos, menus e tooltips abertos de dentro da pasta seguem o tema da pasta.

Em Configurações da pasta há a seção "Aparência" (`FolderAppearanceSection`, âncora `#aparencia`): escolha de cores, fonte e peso, com opção "herdar", indicação da origem de cada eixo e uma prévia (um painel no modo atual, com botão para ver no outro modo). Editável para OWNER/ADMIN do workspace; só leitura para MEMBER; oculta para os demais e quando a flag está desligada.

## Escopo e atributos

- `ThemedMain` (`features/folders/components/themed-main.tsx`) renderiza o `<main>` do dashboard e põe `data-folder-palette`, `data-folder-font` e `data-folder-weight` apenas para eixos diferentes de `default` e conhecidos no catálogo (`toScopeAttributes` em `lib/appearance/scope.ts`).
- Quem está ativo vem de `FolderAppearanceProvider` (layout do dashboard). `useActiveFolderAppearance(folderId, folder)` ativa a pasta da rota; enquanto os dados carregam, a aparência anterior é mantida (estado `pending`), e a liberação é adiada para não piscar o tema padrão.
- Sem atributos (pasta padrão, flag desligada ou opt-out) o `<main>` fica idêntico ao de antes.

## CSS gerado

- Fonte da verdade: `src/lib/appearance/folder-appearance-catalog.json` (cópia verbatim do catálogo do backend, `catalogVersion` 1).
- `npm run gen:appearance` roda `scripts/generate-folder-appearance-css.ts` e grava `src/app/folder-appearance.css` (cerca de 15 KB; não editar à mão). `globals.css` o importa.
- Paletas trocam destaque e neutros (`--primary`, `--background`, `--card`, `--muted`, `--border`, sombras…), com variante `.dark`. Fontes trocam `--font-sans`; pesos trocam `--font-weight-medium/semibold/bold`.
- `[data-folder-palette]:not([data-folder-portal-host])` aplica `background-color` e `color`; o host de portal não pinta fundo.
- Testes (`npm run test:unit`): `css-generator`, `catalog`, `contrast-pairs`, `color-math`, `scope`, `composition-guard` (ADR 0006).

## Host de portal

`ThemedMain` cria, via `createPortal`, um `<div data-folder-portal-host>` no fim do `<body>` com os mesmos atributos, só quando há tema ativo (client only). `FolderPortalContainerProvider` entrega esse elemento e `useFolderPortalContainer()` é usado por `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `dropdown-menu`, `select` e `mention-textarea`. Fora do `<main>` o valor é `undefined` e os portais vão para o `body` (tema padrão).

## Fontes

`lib/appearance/folder-fonts.ts` declara 5 fontes variáveis do `next/font/google` (Inter, Nunito, Lexend, Atkinson Hyperlegible Next, Source Serif 4) com `preload: false`: o navegador só baixa o arquivo quando um elemento usa a família. `folderFontVariables` entra na classe do `<html>`. `useActiveFolderAppearance` pede `document.fonts.load` da fonte assim que a chave é conhecida (otimização, nunca aguardada).

## Preferência local

`features/folders/lib/folder-appearance-pref.ts`: a chave `taskflow.ignoreFolderAppearance` no `localStorage` vale `"1"` quando a pessoa escolhe ignorar a aparência das pastas neste navegador; ausente, sem storage ou erro de leitura significam "não ignora". Store externo (`useSyncExternalStore`) mantém todos os leitores em sincronia, inclusive entre abas (evento `storage`). O controle fica em `components/shared/theme-toggle.tsx`. `useFolderAppearanceEnabled(workspaceId)` = flag `folders.appearance` ligada (via `useMyFeaturesQuery`) **e** opt-out desligado.

## Edição

- `PATCH /folders/:id/appearance`, parcial por eixo (`useUpdateFolderAppearanceMutation`). `appearance-draft.ts` calcula `diffAppearanceDraft(saved, draft)`: só os eixos alterados vão no corpo, para não sobrescrever o que outra pessoa gravou. `null` = herdar; `'default'` = cortar a herança.
- `previewEffectiveAfterMove` mostra a aparência que a pasta teria depois de mover (eixos próprios vencem; `null` herda do destino).

## Contrato da API

- Leitura: todo `FolderDto` traz `appearance` (chaves próprias, `null` = herda) e `effectiveAppearance` (`paletteKey`, `fontKey`, `weightKey`, `source` por eixo: `self | ancestor | default`, `sourceFolderId` por eixo, `catalogVersion`).
- `sourceFolderId` é **omitido** para GUEST do workspace e convidado só da pasta (D10); `source` continua vindo. O front trata o campo como opcional.
- Escrita: só OWNER/ADMIN; `FOLDER_APPEARANCE_INVALID` (400, com `field`), `FORBIDDEN_WORKSPACE_ACTION` (403), `FEATURE_DISABLED` (403), `FOLDER_NOT_FOUND` (404). Não sobe `version` da pasta; o sync push ignora chaves de aparência.
- Mover a pasta muda a aparência herdada dela e da subárvore (o cache de pastas é atualizado por `folder-cache`).

## Rollout

A flag `folders.appearance` nasce **desligada** para todos (`defaultEnabled = false`). Depois do deploy do backend, um SUPER_ADMIN liga manualmente, no painel de feature flags, nesta ordem:

1. regras **USER** `enabled` (time interno);
2. regras **PLAN** `enabled` (FREE e PRO);
3. regra **GLOBAL** `enabled`.

Nunca se cria uma regra **GLOBAL disabled**: o GLOBAL vence USER e PLAN e desligaria a funcionalidade para todos. Regras de escopo WORKSPACE não se aplicam (a rota não tem `:workspaceId`). O rollout é um passo manual, não faz parte do deploy do front. Medir CLS e bytes antes do GLOBAL.

## Arquivos

- `src/features/folders/components/`: `themed-main.tsx`, `folder-appearance-section.tsx`, `folder-appearance-preview.tsx`
- `src/features/folders/context/folder-appearance-context.tsx`
- `src/features/folders/hooks/`: `use-active-folder-appearance.ts`, `use-folder-appearance.ts`, `use-folder-appearance-enabled.ts`
- `src/features/folders/lib/`: `appearance-draft.ts`, `appearance-options.ts`, `folder-appearance-pref.ts`
- `src/lib/appearance/`: `catalog.ts`, `folder-appearance-catalog.json`, `css-generator.ts`, `scope.ts`, `folder-fonts.ts`, `color-math.ts`, `contrast-pairs.ts`
- `src/app/folder-appearance.css` (gerado), `scripts/generate-folder-appearance-css.ts`
