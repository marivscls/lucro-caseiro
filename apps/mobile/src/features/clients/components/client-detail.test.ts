import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lucro-caseiro/ui", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) =>
    React.createElement("button", { onClick: onPress }, title),
}));
vi.mock("../../../shared/layout/use-desktop-layout", () => ({
  useDesktopLayout: () => false,
}));
vi.mock("../hooks", () => ({
  useClient: () => ({
    isLoading: false,
    error: null,
    data: {
      id: "client-1",
      userId: "user-1",
      name: "Maria",
      phone: null,
      address: null,
      birthday: null,
      notes: null,
      tags: [],
      nextContactAt: null,
      nextContactReason: null,
      nextContactNotes: null,
      totalSpent: 0,
      createdAt: "2026-09-09T12:00:00Z",
    },
  }),
}));
vi.mock("../../sales/hooks", () => ({ useSales: () => ({ data: { items: [] } }) }));

import { ClientDetail } from "./client-detail";

describe("ClientDetail actions", () => {
  afterEach(cleanup);

  it("opens editing even when the client has no phone", () => {
    const onEditPress = vi.fn();
    render(React.createElement(ClientDetail, { clientId: "client-1", onEditPress }));
    fireEvent.click(screen.getByRole("button", { name: "Editar cliente" }));
    expect(onEditPress).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "WhatsApp" })).toBeNull();
  });
});
