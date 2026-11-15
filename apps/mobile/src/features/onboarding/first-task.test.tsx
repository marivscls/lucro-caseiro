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
vi.mock("expo-status-bar", () => ({ StatusBar: () => null }));
vi.mock("../../shared/guidance/tutorial-video-modal", () => ({
  TutorialVideoModal: ({
    visible,
    video,
    actionLabel,
    onAction,
  }: {
    visible: boolean;
    video: { title: string };
    actionLabel: string;
    onAction: () => void;
  }) =>
    visible ? (
      <div role="dialog" aria-label={video.title}>
        <button onClick={onAction}>{actionLabel}</button>
      </div>
    ) : null,
}));
import { FirstTask } from "./first-task";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const START = "Calcular meu primeiro preço";

describe("first-access welcome before pricing", () => {
  it("greets by first name and waits for the person to start", () => {
    const onStart = vi.fn(() => Promise.resolve(true));
    render(
      <FirstTask
        name="Mariana Souza"
        onStart={onStart}
        onExplore={() => Promise.resolve(true)}
      />,
    );
    expect(screen.getByRole("heading").textContent).toContain("Conta criada, Mariana.");
    expect(onStart).not.toHaveBeenCalled();
  });
  it("opens pricing from the main action", async () => {
    let destination = "";
    render(
      <FirstTask
        onStart={(route) => {
          destination = route;
          return Promise.resolve(true);
        }}
        onExplore={() => Promise.resolve(true)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: START }));
    await waitFor(() => expect(destination).toBe("/pricing"));
  });
  it("lets the person explore the app instead of pricing", async () => {
    const onStart = vi.fn(() => Promise.resolve(true));
    const onExplore = vi.fn(() => Promise.resolve(true));
    render(<FirstTask onStart={onStart} onExplore={onExplore} />);
    fireEvent.click(screen.getByRole("button", { name: "Conhecer o app primeiro" }));
    await waitFor(() => expect(onExplore).toHaveBeenCalledOnce());
    expect(onStart).not.toHaveBeenCalled();
  });
  it("keeps the actions and allows retry when saving the decision fails", async () => {
    let attempts = 0;
    render(
      <FirstTask
        onStart={() => {
          attempts += 1;
          return Promise.resolve(false);
        }}
        onExplore={() => Promise.resolve(true)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: START }));
    await screen.findByText(/tente novamente/i);
    fireEvent.click(screen.getByRole("button", { name: START }));
    await waitFor(() => expect(attempts).toBe(2));
    expect(screen.getByRole("button", { name: "Conhecer o app primeiro" })).toBeTruthy();
  });
  it("follows the priority chosen in the questionnaire", async () => {
    const onStart = vi.fn((_route: string) => Promise.resolve(true));
    render(
      <FirstTask
        name="Ana"
        profile={{
          name: "Ana",
          business: "",
          segment: "sweets",
          stage: "starting",
          channels: ["whatsapp"],
          goal: "catalog",
        }}
        onStart={onStart}
        onExplore={() => Promise.resolve(true)}
      />,
    );
    expect(screen.getByRole("heading").textContent).toContain("vitrine");
    fireEvent.click(screen.getByRole("button", { name: "Montar meu catálogo" }));
    await waitFor(() => expect(onStart).toHaveBeenCalledWith("/catalog"));
  });
  it("offers the pricing video only when videos are configured", async () => {
    const onStart = vi.fn(() => Promise.resolve(true));
    const view = render(
      <FirstTask onStart={onStart} onExplore={() => Promise.resolve(true)} />,
    );
    expect(screen.queryByRole("button", { name: /Ver como funciona/ })).toBeNull();
    view.unmount();

    vi.stubEnv("EXPO_PUBLIC_TUTORIAL_VIDEOS_URL", "http://localhost:8788");
    render(<FirstTask onStart={onStart} onExplore={() => Promise.resolve(true)} />);
    fireEvent.click(screen.getByRole("button", { name: /Ver como funciona/ }));
    const dialog = screen.getByRole("dialog", { name: "Precificação na prática" });
    fireEvent.click(dialog.querySelector("button")!);
    await waitFor(() => expect(onStart).toHaveBeenCalledWith("/pricing"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
