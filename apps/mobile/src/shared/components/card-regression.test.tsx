import React from "react";
import { render, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Card } from "../../../../../packages/ui/src/components/card";

vi.mock("../../../../../packages/ui/src/theme-context", () => ({
  useTheme: () => ({
    theme: {
      colors: { surface: "white", surfaceElevated: "gray", border: "gray" },
      shadows: {},
    },
  }),
}));
vi.mock("../../../../../packages/ui/src/components/pressable-scale", () => ({
  PressableScale: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));
vi.mock("react-native", () => ({
  View: ({ children, style }: { children: React.ReactNode; style: unknown }) => {
    const flatten = (value: unknown): Record<string, unknown> => {
      if (Array.isArray(value)) return Object.assign({}, ...value.map(flatten));
      if (value && typeof value === "object") return value as Record<string, unknown>;
      return {};
    };
    return <div style={flatten(style)}>{children}</div>;
  },
}));
afterEach(cleanup);

it("renders a FlatList-style nested array without numeric CSS properties", () => {
  const { getByText } = render(
    <Card style={[undefined, [{ opacity: 0.5 }, { padding: 7 }]]}>Retry</Card>,
  );
  expect(getByText("Retry").style.padding).toBe("7px");
  expect(getByText("Retry").style.opacity).toBe("0.5");
});

it("retains object-style overrides", () => {
  const { getByText } = render(<Card style={{ padding: 9 }}>Empty</Card>);
  expect(getByText("Empty").style.padding).toBe("9px");
});
