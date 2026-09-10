export type ColorMode = "aurora" | "ember" | "ice" | "prism";
export type BackgroundId = "void" | "ink" | "paper" | "forest" | "abyss";

export interface Background {
  id: BackgroundId;
  label: string;
  color: string;
  rgb: [number, number, number];
}

export interface ColorModeDef {
  id: ColorMode;
  label: string;
  hue0: number;
  hue1: number;
  sat: number;
  light: number;
  lightOnPaper: number;
  shift: number;
}

export const BACKGROUNDS: readonly Background[] = [
  { id: "void", label: "Void", color: "#070708", rgb: [7, 7, 8] },
  { id: "ink", label: "Ink", color: "#0a1018", rgb: [10, 16, 24] },
  { id: "paper", label: "Paper", color: "#ebe6db", rgb: [235, 230, 219] },
  { id: "forest", label: "Forest", color: "#0a120e", rgb: [10, 18, 14] },
  { id: "abyss", label: "Abyss", color: "#031016", rgb: [3, 16, 22] },
] as const;

export const COLOR_MODES: readonly ColorModeDef[] = [
  {
    id: "aurora",
    label: "Aurora",
    hue0: 148,
    hue1: 198,
    sat: 78,
    light: 62,
    lightOnPaper: 38,
    shift: 14,
  },
  {
    id: "ember",
    label: "Ember",
    hue0: 8,
    hue1: 38,
    sat: 86,
    light: 60,
    lightOnPaper: 42,
    shift: 10,
  },
  {
    id: "ice",
    label: "Ice",
    hue0: 186,
    hue1: 224,
    sat: 72,
    light: 68,
    lightOnPaper: 36,
    shift: 12,
  },
  {
    id: "prism",
    label: "Prism",
    hue0: 0,
    hue1: 360,
    sat: 74,
    light: 62,
    lightOnPaper: 40,
    shift: 22,
  },
] as const;

export function backgroundById(id: BackgroundId): Background {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

export function colorModeById(id: ColorMode): ColorModeDef {
  return COLOR_MODES.find((m) => m.id === id) ?? COLOR_MODES[0];
}

export function isLightRgb(rgb: [number, number, number]): boolean {
  const [r, g, b] = rgb;
  return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255 > 0.45;
}
