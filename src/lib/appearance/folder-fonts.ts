import { Atkinson_Hyperlegible_Next, Inter, Lexend, Nunito, Source_Serif_4 } from "next/font/google";
import type { FolderFontKey } from "@/types/folder-appearance";

// Folder fonts are variable fonts (no axes/weight) with preload disabled: the
// browser only downloads a file when an element actually uses the family.
const inter = Inter({ variable: "--font-folder-inter", subsets: ["latin"], display: "swap", preload: false });
const nunito = Nunito({ variable: "--font-folder-nunito", subsets: ["latin"], display: "swap", preload: false });
const lexend = Lexend({ variable: "--font-folder-lexend", subsets: ["latin"], display: "swap", preload: false });
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-folder-atkinson",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const sourceSerif = Source_Serif_4({
  variable: "--font-folder-source-serif",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

type NextFontWithVariable = Extract<ReturnType<typeof Inter>, { variable: string }>;

export const FOLDER_FONTS: Record<Exclude<FolderFontKey, "default">, NextFontWithVariable> = {
  inter,
  nunito,
  lexend,
  atkinson,
  "source-serif": sourceSerif,
};

/** All `.variable` classes together, to be set once on <html>. */
export const folderFontVariables: string = Object.values(FOLDER_FONTS)
  .map((f) => f.variable)
  .join(" ");
