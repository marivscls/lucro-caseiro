import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("react-native", async () => vi.importActual("react-native-web"));
vi.mock("../../../../../packages/ui/src/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));
vi.mock("@lucro-caseiro/ui", async () =>
  vi.importActual("../../../../../packages/ui/src/index"),
);
import { FirstTask } from "./first-task";

afterEach(cleanup);

describe("first action before completing the business profile", () => {
  it("opens the chosen goal without collecting business details first", async () => {
    let destination = "";
    render(
      <FirstTask
        onStart={(route) => {
          destination = route;
          return Promise.resolve(true);
        }}
        onConfigure={() => {}}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar minha primeira venda" }),
    );
    await waitFor(() => expect(destination).toBe("/tabs/new-sale"));
  });
  it("keeps the choices and allows retry when completing onboarding fails", async () => {
    let attempts = 0;
    render(
      <FirstTask
        onStart={() => {
          attempts += 1;
          return Promise.resolve(false);
        }}
        onConfigure={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Calcular meu primeiro preço" }));
    await screen.findByText(/tente novamente/i);
    fireEvent.click(screen.getByRole("button", { name: "Calcular meu primeiro preço" }));
    await waitFor(() => expect(attempts).toBe(2));
  });
});
