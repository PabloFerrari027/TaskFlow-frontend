---
name: taskflow-web-ship
description: Checklist de entrega do TaskFlow-frontend antes de commit, push ou PR — gerar os tipos de rota do Next (next typegen) antes do tsc, lint, checagens de contrato com o backend (codes de erro e tools do assistente), verificação manual no navegador (o repo não tem testes automatizados), ARCHITECTURE.md/README no mesmo PR e git seguro (stage só dos próprios arquivos, branch feat|fix|refactor/<slug>, Conventional Commits em inglês com escopo, PR para main). Use sempre que o usuário disser "antes do push", "pode commitar", "commit", "abrir PR", "subir", "terminei, confere tudo", "está pronto para revisão", "o tsc está reclamando de PageProps/LayoutProps", ou ao fechar qualquer feature/correção neste repo.
---

# Antes do commit / push / PR (frontend)

Só faça commit, push ou PR quando o usuário pedir. Os passos 1–5 valem mesmo quando ele só pergunta
"está pronto?". Não há testes automatizados neste repo (`package.json` só tem `dev`, `build`,
`start`, `lint`): a verificação é tipo + lint + uso real no navegador.

## Passos

1. **Saiba o que é seu.** `git status --short` e `git diff --stat`. Liste os arquivos que VOCÊ
   alterou; arquivo alheio fica como está e você avisa. `AGENTS.md` alterado sozinho é o bloco que o
   `next dev` reescreve (ver o próprio arquivo) — não reverta.

2. **Tipos:**
   ```bash
   npx next typegen && npx tsc --noEmit
   ```
   `PageProps`/`LayoutProps` são gerados pelo Next; sem o `typegen` (ou um `dev`/`build` antes) o
   `tsc` falha com "Cannot find name 'PageProps'" em toda página dinâmica, sem ser erro seu.
   Erro em arquivo que não é seu: anote, não corrija.

3. **Lint:** `npm run lint` (aqui é `eslint` sem `--fix`, não altera nada). Julgue pelo **código de
   saída** e pela linha `✖ N problems`, não por um `tail` da saída. O eslint varre o repo todo,
   inclusive `.claude/`: script de skill é ESM `.mjs` com `import` (`require()` quebra o lint).
   Para corrigir, só nos seus arquivos: `npx eslint --fix <arquivos>`.

4. **Contrato com o backend** (se a mudança toca API, erros ou assistente):
   ```bash
   node .claude/skills/taskflow-web-api-contract/scripts/check-error-codes.mjs
   node .claude/skills/taskflow-web-assistant/scripts/check-assistant-tools.mjs
   ```
   Os dois saem `OK` hoje; pendência nova que apareça sem relação com a sua mudança vem de commit
   novo no backend — cite no resumo em vez de corrigir no mesmo PR.

5. **Navegador**, contra a API local (backend em `http://localhost:3000`; front com
   `npm run dev -- -p 3001`, `.env.local` com `NEXT_PUBLIC_API_URL`). Use a skill `run` para subir
   e dirigir o app se precisar. Percorra o fluxo mudado:
   - caminho feliz, carregamento, erro (desligue a API: aparece `ErrorState` com "Tentar novamente") e vazio;
   - um usuário sem permissão (GUEST / MEMBER) não vê o botão e a URL direta mostra acesso restrito;
   - tema claro e escuro; largura de celular;
   - se a mutation é offline-capable: DevTools → Network → Offline (skill `taskflow-web-offline`).
   Se não deu para testar no navegador, diga isso claramente — não declare pronto.

6. **Build (opcional, mais lento):** `npm run build` pega erro de fronteira server/client e de
   prerender que o `tsc` não pega. Rode quando mexer em `layout.tsx`, páginas server, `redirect()`
   ou metadata. (Não foi validado ao escrever esta skill.)

7. **Documentação no mesmo PR** (`ARCHITECTURE.md`, pt-BR):
   - §4 árvore de rotas (rota nova), §6 se mudou permissão, §8/§10 se mudou cache/offline,
     §11 tabela de domínios e a seção da feature, §15 limitações (remova as que caíram);
   - `README.md` se mudou setup, env ou a lista de features;
   - guia do tutorial se a tela mudou de rótulo (skill `taskflow-web-screen`).
   O histórico mostra docs atualizadas em lote depois (commits `docs:`); prefira no mesmo PR e, se
   ficar para depois, diga no PR o que ficou desatualizado.

8. **Branch** (se estiver na `main`): `git switch -c <tipo>/<slug-em-inglês>` com tipo
   `feat|fix|refactor|docs|chore`.

9. **Stage só dos seus arquivos**, nunca `git add -A`/`git add .`:
   ```bash
   git add <arquivo1> <arquivo2> ...
   git diff --cached --stat
   ```

10. **Commit** Conventional Commits em inglês, escopo = feature (`feat(plans): …`,
    `feat(assistant): …`, `refactor: …` quando transversal), assunto no imperativo sem ponto final,
    corpo com o porquê. Termine com as linhas de atribuição que o sistema indicar.

11. **Push e PR** para `main`: `git push -u origin <branch>` e `gh pr create --base main`, corpo com
    o que muda, por quê, o que foi verificado no navegador (e o que não foi), e o PR do backend
    relacionado, se houver. Termine com a linha de atribuição indicada.

## Checklist final

- [ ] Só arquivos seus no stage
- [ ] `npx next typegen && npx tsc --noEmit` limpo nos seus arquivos
- [ ] `npm run lint` limpo
- [ ] Scripts de contrato sem pendência nova causada (ou não resolvida) pela mudança
- [ ] Fluxo testado no navegador: feliz, erro, vazio, sem permissão, claro/escuro, celular (ou dito que não foi)
- [ ] `ARCHITECTURE.md` (rotas, feature, limitações) e `README.md` atualizados ou pendência declarada
- [ ] Branch `<tipo>/<slug>`, commit Conventional em inglês com escopo, PR para `main`
