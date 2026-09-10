import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BackgroundId, ColorMode } from "@/lib/particles/palettes";

export interface FieldSettings {
  count: number;
  force: number;
  trails: number;
  colorMode: ColorMode;
  background: BackgroundId;
  attract: boolean;
}

interface FieldStore extends FieldSettings {
  setCount: (count: number) => void;
  setForce: (force: number) => void;
  setTrails: (trails: number) => void;
  setColorMode: (colorMode: ColorMode) => void;
  setBackground: (background: BackgroundId) => void;
  setAttract: (attract: boolean) => void;
  restoreDefaults: () => void;
}

export const COUNT_MIN = 200;
export const COUNT_MAX = 5000;
export const FORCE_MIN = 0.2;
export const FORCE_MAX = 2.6;
export const TRAILS_MIN = 0;
export const TRAILS_MAX = 1;

export const DEFAULT_SETTINGS: FieldSettings = {
  count: 1800,
  force: 1,
  trails: 0.72,
  colorMode: "aurora",
  background: "void",
  attract: true,
};

export function clampCount(n: number): number {
  return Math.round(Math.min(COUNT_MAX, Math.max(COUNT_MIN, n)));
}

export const useFieldSettings = create<FieldStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setCount: (count) => set({ count: clampCount(count) }),
      setForce: (force) =>
        set({ force: Math.min(FORCE_MAX, Math.max(FORCE_MIN, force)) }),
      setTrails: (trails) =>
        set({ trails: Math.min(TRAILS_MAX, Math.max(TRAILS_MIN, trails)) }),
      setColorMode: (colorMode) => set({ colorMode }),
      setBackground: (background) => set({ background }),
      setAttract: (attract) => set({ attract }),
      restoreDefaults: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "aether-field-v1",
      version: 1,
      partialize: (state) => ({
        count: state.count,
        force: state.force,
        trails: state.trails,
        colorMode: state.colorMode,
        background: state.background,
        attract: state.attract,
      }),
    },
  ),
);
