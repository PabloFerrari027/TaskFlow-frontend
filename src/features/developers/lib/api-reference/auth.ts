import type { ApiEndpoint } from "@/features/developers/lib/api-reference-data";

// API.md § 2-3 (Auth + Sessões). Não depende de workspaceId — são rotas de
// conta, chamadas antes/fora de qualquer workspace específico.
export function buildAuthEndpoints(): ApiEndpoint[] {
  return [
    {
      method: "POST",
      path: "/auth/register",
      summary: "Cadastrar com e-mail/senha",
      description:
        "Cria a conta e envia um código de verificação de 6 dígitos por e-mail. Não autentica automaticamente — a conta nasce `PENDING_VERIFICATION` e o login fica bloqueado até confirmar o e-mail.",
      bodyParams: [
        { name: "name", type: "string", required: true, notes: "1 a 100 caracteres" },
        { name: "email", type: "string", required: true },
        { name: "password", type: "string", required: true, notes: "mínimo 8 caracteres" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/register" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"name\": \"Jane Doe\", \"email\": \"user@example.com\", \"password\": \"S3curePassw0rd!\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample:
        '{ "userId": "uuid", "name": "Jane Doe", "email": "user@example.com", "status": "PENDING_VERIFICATION" }',
      errorCodes: ["USER_ALREADY_EXISTS", "INVALID_USER_NAME"],
    },
    {
      method: "POST",
      path: "/auth/verify-email",
      summary: "Confirmar e-mail do cadastro",
      description:
        "Confirma o código de verificação e ativa a conta (`PENDING_VERIFICATION` → `ACTIVE`), liberando o login. Rate-limited (10/min); código expira em 15 min e permite até 5 tentativas.",
      bodyParams: [
        { name: "email", type: "string", required: true },
        { name: "code", type: "string", required: true, notes: "6 dígitos" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/verify-email" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"email\": \"user@example.com\", \"code\": \"123456\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "userId": "uuid", "email": "user@example.com", "status": "ACTIVE" }',
      errorCodes: [
        "USER_NOT_FOUND",
        "EMAIL_ALREADY_VERIFIED",
        "EMAIL_VERIFICATION_NOT_FOUND",
        "EMAIL_VERIFICATION_EXPIRED",
        "EMAIL_VERIFICATION_INVALID_CODE",
        "EMAIL_VERIFICATION_MAX_ATTEMPTS_EXCEEDED",
      ],
    },
    {
      method: "POST",
      path: "/auth/resend-verification-code",
      summary: "Reenviar código de verificação",
      description:
        "Invalida qualquer código anterior ainda pendente e envia um novo. Rate-limited por IP (10/min) e por e-mail (3 a cada 10 min).",
      bodyParams: [{ name: "email", type: "string", required: true }],
      requestExample: [
        'curl -X POST "$API_URL/auth/resend-verification-code" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"email\": \"user@example.com\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "expiresInSeconds": 900 }',
      errorCodes: ["TOO_MANY_VERIFICATION_REQUESTS", "USER_NOT_FOUND", "EMAIL_ALREADY_VERIFIED"],
    },
    {
      method: "POST",
      path: "/auth/login",
      summary: "Login — passo 1 (senha)",
      description:
        "Valida e-mail/senha e dispara um código 2FA por e-mail. Não retorna tokens ainda — o passo 2 é `POST /auth/login/verify`. Rate-limited (10/min).",
      bodyParams: [
        { name: "email", type: "string", required: true },
        { name: "password", type: "string", required: true },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/login" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"email\": \"user@example.com\", \"password\": \"S3curePassw0rd!\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "challengeId": "uuid", "expiresInSeconds": 300 }',
      notes: [
        "`401 EMAIL_NOT_VERIFIED` (403, na verdade) indica credenciais corretas mas conta ainda `PENDING_VERIFICATION` — volte para `POST /auth/verify-email`.",
      ],
      errorCodes: ["INVALID_CREDENTIALS", "EMAIL_NOT_VERIFIED"],
    },
    {
      method: "POST",
      path: "/auth/login/verify",
      summary: "Login — passo 2 (código 2FA)",
      description: "Confirma o código 2FA recebido por e-mail e emite os tokens de sessão. Rate-limited (10/min).",
      bodyParams: [
        { name: "challengeId", type: "string", required: true },
        { name: "code", type: "string", required: true, notes: "exatamente 6 dígitos" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/login/verify" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"challengeId\": \"uuid\", \"code\": \"123456\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample:
        '{ "accessToken": "jwt...", "refreshToken": "opaque...", "expiresInSeconds": 604800, "sessionId": "uuid" }',
      notes: [
        "`accessToken` dura 15 min por padrão; `refreshToken`/`expiresInSeconds` são do refresh token (7 dias), não do access token.",
      ],
      errorCodes: ["CHALLENGE_NOT_FOUND", "CHALLENGE_EXPIRED", "CHALLENGE_INVALID_CODE", "CHALLENGE_MAX_ATTEMPTS_EXCEEDED"],
    },
    {
      method: "POST",
      path: "/auth/login/google",
      summary: "Login/cadastro via Google",
      description:
        "Login (ou cadastro automático) via ID Token do Google, obtido no cliente. Sem 2FA adicional — o Google já garante a posse do e-mail.",
      bodyParams: [{ name: "idToken", type: "string", required: true, notes: "ID Token do Google Sign-In" }],
      requestExample: [
        'curl -X POST "$API_URL/auth/login/google" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"idToken\": \"google-id-token\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample:
        '{ "accessToken": "jwt...", "refreshToken": "opaque...", "sessionId": "uuid", "expiresInSeconds": 604800 }',
      errorCodes: ["INVALID_CREDENTIALS"],
    },
    {
      method: "POST",
      path: "/auth/forgot-password",
      summary: "Esqueci minha senha",
      description:
        "Envia por e-mail um link de uso único para redefinir a senha — público, sem auth. A resposta é idêntica exista a conta ou não, então nunca revela quais e-mails têm conta.",
      bodyParams: [{ name: "email", type: "string", required: true }],
      requestExample: [
        'curl -X POST "$API_URL/auth/forgot-password" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"email\": \"user@example.com\" }'",
      ].join("\n"),
      responseStatus: "202 Accepted",
      responseExample: '{ "expiresInSeconds": 1800 }',
      notes: [
        "Só uma conta `ACTIVE` com senha realmente recebe o e-mail; conta só-Google, `PENDING_VERIFICATION` ou desativada respondem 202 do mesmo jeito, sem enviar nada.",
      ],
      errorCodes: ["TOO_MANY_PASSWORD_RESET_REQUESTS"],
    },
    {
      method: "POST",
      path: "/auth/reset-password",
      summary: "Redefinir senha com o link",
      description:
        "Público — a prova de identidade é o segredo do link recebido por e-mail. Revoga todas as sessões da conta na mesma transação.",
      bodyParams: [
        { name: "token", type: "string", required: true, notes: "segredo do link, uso único" },
        { name: "newPassword", type: "string", required: true, notes: "mínimo 8 caracteres" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/reset-password" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"token\": \"segredo-do-link\", \"newPassword\": \"An0therStr0ngOne!\" }'",
      ].join("\n"),
      responseStatus: "204 No Content",
      responseExample: "(sem corpo)",
      errorCodes: ["INVALID_PASSWORD_RESET_TOKEN"],
    },
    {
      method: "POST",
      path: "/auth/refresh",
      summary: "Renovar o access token",
      description:
        "Gira o refresh token (rotação a cada uso) e emite um novo access token. Reusar um refresh token já rotacionado revoga a sessão automaticamente (proteção contra roubo de token).",
      bodyParams: [
        { name: "sessionId", type: "string", required: true },
        { name: "refreshToken", type: "string", required: true },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/refresh" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"sessionId\": \"uuid\", \"refreshToken\": \"opaque...\" }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "accessToken": "jwt...", "refreshToken": "novo-opaque...", "expiresInSeconds": 604800 }',
      notes: ["Sempre substitua o `refreshToken` guardado pelo novo valor — o anterior deixa de ser válido."],
      errorCodes: ["SESSION_NOT_FOUND"],
    },
    {
      method: "GET",
      path: "/auth/me",
      summary: "Meus dados",
      description:
        "Dados básicos da própria conta autenticada. Cacheado (⚡) — `PATCH /auth/password`/`POST /auth/google-link` invalidam o cache do próprio usuário.",
      requestExample: ['curl "$API_URL/auth/me" \\', '  -H "Authorization: Bearer $ACCESS_TOKEN"'].join("\n"),
      responseStatus: "200 OK",
      responseExample:
        '{ "id": "uuid", "email": "user@example.com", "name": "Jane Doe", "hasPhoto": false, "status": "ACTIVE", "hasPassword": true, "googleLinked": false }',
      notes: [
        "`name` é `null` em contas criadas antes deste campo, ou Google sem nome de perfil — caia no e-mail na UI.",
        "`hasPassword`/`googleLinked` decidem qual método de reautenticação oferecer ao confirmar uma ação crítica do assistente (§ 16).",
      ],
    },
    {
      method: "PATCH",
      path: "/auth/me",
      summary: "Editar meu nome",
      description: "Edita o nome da própria conta. Não exige reautenticação nem revoga sessões.",
      bodyParams: [{ name: "name", type: "string", required: true, notes: "1 a 100 caracteres" }],
      requestExample: [
        'curl -X PATCH "$API_URL/auth/me" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"name\": \"Jane Doe\" }'",
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "uuid", "name": "Jane Doe" }',
      errorCodes: ["USER_NOT_FOUND", "INVALID_USER_NAME", "USER_ALREADY_CLOSED"],
    },
    {
      method: "PUT",
      path: "/auth/me/photo",
      summary: "Definir/trocar foto de perfil",
      description:
        "`multipart/form-data`, campo de arquivo `file`. Limite de 5MB, aceita JPEG/PNG/WebP (formato decidido pelo conteúdo, não pelo nome/`Content-Type`). Trocar a foto apaga a anterior do storage.",
      requestExample: [
        'curl -X PUT "$API_URL/auth/me/photo" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -F "file=@avatar.jpg"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "uuid", "hasPhoto": true }',
      errorCodes: ["INVALID_USER_PHOTO", "USER_NOT_FOUND", "USER_ALREADY_CLOSED"],
    },
    {
      method: "GET",
      path: "/users/:userId/photo",
      summary: "Baixar foto de perfil de um usuário",
      description:
        "Retorna o binário da foto (qualquer usuário autenticado pode ler a de qualquer outro, para exibir avatares). Como exige JWT, use fetch + `URL.createObjectURL(blob)`, não um `<img src>` direto.",
      requestExample: [
        'curl "$API_URL/users/USER_ID/photo" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        "  --output avatar.jpg",
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: "(binário — image/jpeg, image/png ou image/webp)",
      errorCodes: ["USER_NOT_FOUND", "USER_PHOTO_NOT_FOUND"],
    },
    {
      method: "PATCH",
      path: "/auth/password",
      summary: "Trocar a senha",
      description:
        "Para conta que já tem senha. Prova de identidade: a senha atual. Revoga todas as **outras** sessões e avisa por e-mail — a sessão atual continua válida.",
      bodyParams: [
        { name: "currentPassword", type: "string", required: true },
        { name: "newPassword", type: "string", required: true, notes: "mínimo 8 caracteres" },
      ],
      requestExample: [
        'curl -X PATCH "$API_URL/auth/password" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"currentPassword\": \"S3curePassw0rd!\", \"newPassword\": \"An0therStr0ngOne!\" }'",
      ].join("\n"),
      responseStatus: "204 No Content",
      responseExample: "(sem corpo)",
      errorCodes: ["ACCOUNT_HAS_NO_PASSWORD", "CURRENT_PASSWORD_INCORRECT", "TOO_MANY_PASSWORD_ATTEMPTS"],
    },
    {
      method: "POST",
      path: "/auth/password",
      summary: "Definir a primeira senha",
      description:
        "Para conta só-Google (`hasPassword: false`). Como não há senha atual, a prova de identidade é um ID Token do Google recém-emitido, da conta já vinculada.",
      bodyParams: [
        { name: "newPassword", type: "string", required: true, notes: "mínimo 8 caracteres" },
        { name: "googleIdToken", type: "string", required: true },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/password" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"newPassword\": \"S3curePassw0rd!\", \"googleIdToken\": \"google-id-token\" }'",
      ].join("\n"),
      responseStatus: "204 No Content",
      responseExample: "(sem corpo)",
      errorCodes: ["ACCOUNT_ALREADY_HAS_PASSWORD", "NO_IDENTITY_METHOD_AVAILABLE", "INVALID_GOOGLE_TOKEN", "TOO_MANY_PASSWORD_ATTEMPTS"],
    },
    {
      method: "POST",
      path: "/auth/google-link",
      summary: "Vincular uma conta Google",
      description:
        "Simétrico ao anterior: dá um login Google a uma conta que já tem senha. Prova de identidade é a senha atual (não o token Google) — o e-mail do Google não precisa bater com o da conta.",
      bodyParams: [
        { name: "currentPassword", type: "string", required: true },
        { name: "googleIdToken", type: "string", required: true, notes: "recém-emitido, da conta a vincular" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/auth/google-link" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"currentPassword\": \"S3curePassw0rd!\", \"googleIdToken\": \"google-id-token\" }'",
      ].join("\n"),
      responseStatus: "204 No Content",
      responseExample: "(sem corpo)",
      errorCodes: ["ACCOUNT_HAS_NO_PASSWORD", "ACCOUNT_ALREADY_HAS_GOOGLE", "CURRENT_PASSWORD_INCORRECT", "INVALID_GOOGLE_TOKEN", "GOOGLE_ACCOUNT_ALREADY_LINKED"],
    },
    {
      method: "GET",
      path: "/auth/sessions",
      summary: "Listar sessões ativas",
      description: "Paginado, cacheado. `current` indica se é a sessão usada na requisição atual.",
      queryParams: [
        { name: "page", type: "number", required: false, notes: "padrão 1" },
        { name: "limit", type: "number", required: false, notes: "padrão 20, máx. 100" },
      ],
      requestExample: ['curl "$API_URL/auth/sessions" \\', '  -H "Authorization: Bearer $ACCESS_TOKEN"'].join("\n"),
      responseStatus: "200 OK",
      responseExample: [
        "{",
        '  "data": [ { "id": "uuid", "deviceInfo": "Mozilla/5.0 ...", "ipAddress": "203.0.113.4", "current": true, "...": "..." } ],',
        '  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }',
        "}",
      ].join("\n"),
    },
    {
      method: "DELETE",
      path: "/auth/sessions/:sessionId",
      summary: "Revogar uma sessão",
      description: "Logout de um dispositivo específico.",
      requestExample: [
        'curl -X DELETE "$API_URL/auth/sessions/SESSION_ID" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "revoked": true }',
      errorCodes: ["SESSION_NOT_FOUND"],
    },
    {
      method: "DELETE",
      path: "/auth/sessions",
      summary: "Revogar todas as sessões",
      description: "Logout global — todos os dispositivos, inclusive o atual.",
      requestExample: ['curl -X DELETE "$API_URL/auth/sessions" \\', '  -H "Authorization: Bearer $ACCESS_TOKEN"'].join(
        "\n",
      ),
      responseStatus: "200 OK",
      responseExample: '{ "revokedCount": 3 }',
    },
  ];
}
