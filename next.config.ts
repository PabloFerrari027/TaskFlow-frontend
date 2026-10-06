import type { NextConfig } from "next";

// Links de antes da renomeação projeto→pasta / tarefa→item (e-mails, notificações, favoritos)
// continuam abrindo o lugar certo. `taskId` era o parâmetro do painel lateral (hoje `itemId`).
const LEGACY_PANEL_PARAM = [{ type: "query" as const, key: "taskId", value: "(?<itemId>[^&]+)" }];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/projects/:folderId/tasks/:itemId", destination: "/folders/:folderId/items/:itemId", permanent: true },
      { source: "/projects/:folderId/tasks", has: LEGACY_PANEL_PARAM, destination: "/folders/:folderId/items?itemId=:itemId", permanent: true },
      { source: "/projects/:folderId/tasks", destination: "/folders/:folderId/items", permanent: true },
      { source: "/projects/:path*", has: LEGACY_PANEL_PARAM, destination: "/folders/:path*?itemId=:itemId", permanent: true },
      { source: "/projects/:path*", destination: "/folders/:path*", permanent: true },
      { source: "/invite/project/:token", destination: "/invite/folder/:token", permanent: true },
    ];
  },
};

export default nextConfig;
