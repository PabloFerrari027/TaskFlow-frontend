# 0006. AA do tema padrão e composições de cor opacas

- **Status:** Proposto
- **Data:** 2026-11-26
- **Módulo:** aparencia
- **PR:** feat/temas-pasta-front (F0)

## Contexto

O tema padrão tinha pares de cor abaixo de AA e vários componentes compunham alfa sobre tokens (`hover:bg-primary/80`, `ring-ring/50`, `text-primary-foreground/80`, `text-destructive/70`). Com paletas por pasta os tokens mudam, e uma composição com alfa deixa de ter contraste garantido.

## Decisão

- Os tokens do tema padrão foram corrigidos (Task 2) e ganharam `--primary-hover`.
- Hover do primário usa `hover:bg-primary-hover`; foco usa `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring` (anel opaco); texto sobre primário e texto destrutivo não usam alfa; `bg-destructive/70|80` virou `bg-destructive`.
- Permitidas: `bg-primary/10`, `bg-destructive/10|20|30`, `bg-success/5|10|15` e anéis de erro `aria-invalid:`/`dark:` que não sejam foco nem texto.
- `src/lib/appearance/composition-guard.test.ts` percorre `src/**/*.tsx` e falha listando `arquivo:linha` para cada composição proibida fora de uma allowlist comentada (hoje vazia).

## Alternativas consideradas

- Calcular o contraste de cada composição em runtime: complexo e sem teste simples; descartado em favor de tokens opacos.
- Manter alfa e validar só o tema padrão: quebraria nas paletas de pasta.

## Consequências

- **Positivas:** contraste AA vale para qualquer paleta; regressões são pegas por `npm run test:unit`.
- **Negativas / trade-offs:** o visual muda levemente (anel de foco mais forte, hover do primário distinto); o teste é textual e não enxerga classes montadas dinamicamente.
