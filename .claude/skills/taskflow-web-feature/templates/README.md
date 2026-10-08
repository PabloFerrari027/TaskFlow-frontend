# Templates de feature

Derivados de `src/features/time-tracking` (service, hooks, componente com estados de carga/erro/vazio)
e de `src/types/time-tracking.ts`. O exemplo usa um recurso fictício "Widget" pendurado num item.

| No template | Troque por | Exemplo |
|---|---|---|
| `Widget` / `widget` / `widgets` | nome do recurso (PascalCase / camelCase / plural) | `TimeEntry` / `timeEntry` / `time-entries` |
| `widgets` (pasta da feature, chave raiz de query) | kebab-case | `time-tracking` |

| Arquivo | Vai para |
|---|---|
| `types.ts.tmpl` | `src/types/widget.ts` |
| `service.ts.tmpl` | `src/features/widgets/api/widgets-service.ts` |
| `query-keys.snippet.ts.tmpl` | trecho a colar dentro de `queryKeys` em `src/lib/query-keys.ts` |
| `hooks.ts.tmpl` | `src/features/widgets/hooks/use-widgets.ts` |
| `section.tsx.tmpl` | `src/features/widgets/components/item-widgets-section.tsx` |
| `page.tsx.tmpl` | `src/app/(dashboard)/.../page.tsx` (só se a feature tiver rota própria) |

Antes de copiar, abra o arquivo real equivalente em `time-tracking`: se ele mudou, o código real
vale mais que o template.
