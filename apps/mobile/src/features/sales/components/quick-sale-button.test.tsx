import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickSaleButton } from "./quick-sale-button";

vi.mock("@lucro-caseiro/ui", () => ({
  Button: ({
    title,
    onPress,
    loading,
  }: {
    title: string;
    onPress: () => void;
    loading?: boolean;
  }) => (
    <button disabled={loading} onClick={onPress}>
      {title}
    </button>
  ),
}));

afterEach(cleanup);

describe("QuickSaleButton", () => {
  it("confirms a single anonymous sale with an explicit cash override", () => {
    const confirm = vi.fn();
    render(
      <QuickSaleButton
        itemCount={1}
        hasClient={false}
        pending={false}
        onConfirm={confirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Venda rápida no dinheiro" }));
    expect(confirm).toHaveBeenCalledWith("cash");
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, false],
    [2, false],
    [1, true],
  ] as const)(
    "does not offer quick sale with %i items and client=%s",
    (itemCount, hasClient) => {
      render(
        <QuickSaleButton
          itemCount={itemCount}
          hasClient={hasClient}
          pending={false}
          onConfirm={vi.fn()}
        />,
      );
      expect(screen.queryByRole("button")).toBeNull();
    },
  );

  it("does not submit again while the sale is being saved", () => {
    const confirm = vi.fn();
    render(
      <QuickSaleButton itemCount={1} hasClient={false} pending onConfirm={confirm} />,
    );
    const button = screen.getByRole("button", { name: "Venda rápida no dinheiro" });
    fireEvent.click(button);
    expect(confirm).not.toHaveBeenCalled();
  });
});
