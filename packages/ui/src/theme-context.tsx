import React, { createContext, useContext, useState, type ReactNode } from "react";

import { darkTheme, lightTheme, type Theme, type ThemeMode } from "./theme";

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
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const theme = mode === "dark" ? darkTheme : lightTheme;

  const toggleTheme = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
