import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HelpAssistant } from "./help-assistant";
vi.mock("react-native", () => ({
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TextInput: ({
    value,
    onChangeText,
    accessibilityLabel,
    maxLength,
  }: {
    value: string;
    onChangeText: (v: string) => void;
    accessibilityLabel: string;
    maxLength: number;
  }) => (
    <textarea
      aria-label={accessibilityLabel}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChangeText(e.target.value)}
    />
  ),
}));
vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fonts: { regular: "Manrope_400Regular" },
  Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  Typography: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Button: ({
    title,
    onPress,
    disabled,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <button disabled={disabled} onClick={onPress}>
      {title}
    </button>
  ),
}));
afterEach(cleanup);
describe("HelpAssistant", () => {
  it("answers typed questions and opens the relevant screen", () => {
    const navigate = vi.fn();
    render(
      <HelpAssistant profile="food" onNavigate={navigate} onContactSupport={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText("Sua pergunta"), {
      target: { value: "Como sei quanto cobrar?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));
    expect(screen.getByText("Comece reunindo os custos de um produto.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Abrir Precificação" }));
    expect(navigate).toHaveBeenCalledWith("/pricing");
  });
  it("passes the unanswered question to a reviewable support email", () => {
    const contact = vi.fn();
    render(
      <HelpAssistant profile="food" onNavigate={() => {}} onContactSupport={contact} />,
    );
    fireEvent.change(screen.getByLabelText("Sua pergunta"), {
      target: { value: "Minha tela travou" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));
    expect(contact).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Falar por email" }));
    expect(contact).toHaveBeenCalledWith("Minha tela travou");
  });
  it("disables sending an empty question", () => {
    render(
      <HelpAssistant profile="other" onNavigate={() => {}} onContactSupport={() => {}} />,
    );
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Perguntar" }).disabled,
    ).toBe(true);
  });
});
