/** Folder appearance is applied only with the flag on and without the local opt-out. */
export function isAppearanceApplied(flagOn: boolean | undefined, ignore: boolean): boolean {
  return flagOn === true && !ignore;
}

/** Preload a font file only when appearance is applied and the font is non-default (the caller checks it is a known font). */
export function shouldPreloadFont(applied: boolean, fontKey: string | undefined): boolean {
  return applied && !!fontKey && fontKey !== "default";
}

/**
 * The preview applied `appliedTheme`; if the app theme is now something else,
 * the person picked a theme elsewhere (menu) and took control back.
 */
export function isPreviewTakenOver(theme: string | undefined, appliedTheme: string | null): boolean {
  return appliedTheme !== null && theme !== appliedTheme;
}
