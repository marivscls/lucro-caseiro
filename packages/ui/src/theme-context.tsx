import {
  getActiveBrand,
  type BrandConfig,
  type BrandFeatures,
} from "@lucro-caseiro/brands";
import React, { createContext, useContext, useState, type ReactNode } from "react";

import { buildThemes, darkTheme, type Theme, type ThemeMode } from "./theme";

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  mode: "dark",
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({
  children,
  initialMode = "dark",
  onModeChange,
  brand,
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  brand?: BrandConfig;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const themes = buildThemes(brand?.theme);
  const theme = mode === "dark" ? themes.dark : themes.light;

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    onModeChange?.(next);
  };
  const toggleTheme = () => setMode(mode === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

const BrandContext = createContext<BrandConfig>(getActiveBrand());

export function BrandProvider({
  children,
  brand,
}: {
  children: ReactNode;
  brand?: BrandConfig;
}) {
  return (
    <BrandContext.Provider value={brand ?? getActiveBrand()}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

export function useFeature(flag: keyof BrandFeatures) {
  return useBrand().features[flag] ?? false;
}
