// Stub for @lucro-caseiro/ui — avoids pulling in expo dependencies during tests
import { vi } from "vitest";

export const Button = ({ children }: { children?: React.ReactNode }) => children;
export const Card = ({ children }: { children?: React.ReactNode }) => children;
export const Input = () => null;
export const Typography = ({ children }: { children?: React.ReactNode }) => children;
export const Badge = () => null;
export const EmptyState = () => null;
export const ThemeProvider = ({ children }: { children?: React.ReactNode }) => children;

export const useTheme = () => ({
  theme: {
    colors: {
      background: "#1E1814",
      surface: "#2C2420",
      surfaceElevated: "#3A322D",
      text: "#F5EDE8",
      textSecondary: "#B8A9A0",
      textOnPrimary: "#FFFFFF",
      primary: "#C4707E",
      primaryLight: "#D4919C",
      primaryDark: "#A85A67",
      success: "#6BBF96",
      successBg: "#1A2E23",
      alert: "#E07272",
      alertBg: "#2E1A1A",
      premium: "#D4A054",
      premiumBg: "#2E2518",
    },
  },
  mode: "dark" as const,
  toggleTheme: vi.fn(),
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};
