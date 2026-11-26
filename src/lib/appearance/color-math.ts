// origem: TaskFlow-backend/src/modules/folders/domain/appearance/color-math.ts
// The front lands before the backend, so THIS file is the origin of the formulas;
// the backend copies it verbatim to the path above. Keep both in sync.

/** OKLCH color: lightness 0..1, chroma, hue in degrees. */
export type Oklch = readonly [L: number, C: number, h: number];
/** sRGB, gamma encoded, each channel 0..1. */
export type Rgb = readonly [number, number, number];

/** Tolerance on linear sRGB channels before a color counts as out of gamut. */
export const GAMUT_EPSILON = 1e-4;

/** Oklab -> linear sRGB (Ottosson matrices). Channels may fall outside 0..1. */
export function oklchToLinearSrgb([L, C, h]: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** True when every linear channel lies in [-eps, 1 + eps]. */
export function isInGamut(c: Oklch, eps: number = GAMUT_EPSILON): boolean {
  return oklchToLinearSrgb(c).every((v) => v >= -eps && v <= 1 + eps);
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const encodeGamma = (v: number): number =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

const decodeGamma = (v: number): number =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

/** Clamps to 0..1 and applies the sRGB transfer curve. */
export function toSrgbGamma(c: Oklch): Rgb {
  const [r, g, b] = oklchToLinearSrgb(c);
  return [encodeGamma(clamp01(r)), encodeGamma(clamp01(g)), encodeGamma(clamp01(b))];
}

/** Alpha-composites fg over bg in gamma space (a*fg + (1-a)*bg), like the browser. */
export function composite(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [
    alpha * fg[0] + (1 - alpha) * bg[0],
    alpha * fg[1] + (1 - alpha) * bg[1],
    alpha * fg[2] + (1 - alpha) * bg[2],
  ];
}

function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * decodeGamma(r) + 0.7152 * decodeGamma(g) + 0.0722 * decodeGamma(b);
}

/** WCAG 2.x contrast ratio, always >= 1. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** '#rrggbb', lowercase. */
export function toHex(c: Rgb): string {
  return (
    "#" +
    c
      .map((v) =>
        Math.round(clamp01(v) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
