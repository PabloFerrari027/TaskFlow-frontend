// The raw browser text ("Mozilla/5.0 (Windows NT 10.0; ...) Chrome/155...")
// as a person would say it: "Chrome no Windows", "Celular Android".

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser/, "Navegador Samsung"],
  [/Firefox\//, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/CrOS/, "Chromebook"],
  [/Linux/, "Linux"],
];

export function describeDevice(deviceInfo: string | null | undefined): string {
  if (!deviceInfo) return "Aparelho desconhecido";
  const browser = BROWSERS.find(([pattern]) => pattern.test(deviceInfo))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(deviceInfo))?.[1];
  // No browser at all: a script, an integration or the mobile app.
  if (!browser) return system ? `Aplicativo no ${system}` : "Outro aplicativo";
  if (system === "Android") return `${browser} no celular Android`;
  if (system === "iPhone" || system === "iPad") return `${browser} no ${system}`;
  return system ? `${browser} no ${system}` : browser;
}
