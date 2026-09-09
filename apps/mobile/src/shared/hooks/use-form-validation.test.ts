import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFormValidation } from "./use-form-validation";

describe("form validation feedback", () => {
  it("clears the old warning when a dialog is reopened", () => {
    const { result, rerender } = renderHook(
      ({ visible }) => useFormValidation({ name: "Informe o nome." }, visible),
      { initialProps: { visible: true } },
    );
    act(() => {
      result.current.validate();
    });
    expect(result.current.field("name").error).toBeTruthy();
    rerender({ visible: false });
    rerender({ visible: true });
    expect(result.current.field("name").error).toBeUndefined();
  });

  it("focuses a pending field after revealing its step", () => {
    const focus = vi.fn();
    const reveal = vi.fn();
    const { result } = renderHook(() => useFormValidation({ name: "Informe o nome." }));
    act(() => {
      result.current.validate(reveal);
    });
    expect(reveal).toHaveBeenCalledWith("name");
    result.current.field("name").registerFocus(focus);
    expect(focus).toHaveBeenCalledOnce();
  });
  it("blocks submission, reveals all errors, and focuses the first pending field", () => {
    const focus = vi.fn();
    const { result } = renderHook(() =>
      useFormValidation({ name: "Informe o nome.", category: "Escolha a categoria." }),
    );
    expect(result.current.field("name").error).toBeUndefined();
    result.current.field("name").registerFocus(focus);
    act(() => {
      expect(result.current.validate()).toBe(false);
    });
    expect(result.current.field("name").error).toBe("Informe o nome.");
    expect(result.current.field("category").error).toBe("Escolha a categoria.");
    expect(focus).toHaveBeenCalledTimes(1);
    expect(result.current.field("name").summary).toBeTruthy();
    expect(result.current.field("category").summary).toBeUndefined();
  });

  it("clears corrected errors immediately and permits a valid submission", () => {
    const { result, rerender } = renderHook(
      ({ name }) =>
        useFormValidation({ name: name.trim() ? undefined : "Informe o nome." }),
      { initialProps: { name: "   " } },
    );
    act(() => {
      result.current.validate();
    });
    rerender({ name: "Bolo" });
    expect(result.current.field("name").error).toBeUndefined();
    act(() => {
      expect(result.current.validate()).toBe(true);
    });
    act(() => {
      result.current.reset();
    });
    rerender({ name: "" });
    expect(result.current.field("name").error).toBeUndefined();
  });

  it("moves the notice to the next error and refocuses on repeated attempts", () => {
    const focus = vi.fn();
    const { result, rerender } = renderHook(
      ({ selected }) =>
        useFormValidation({
          name: selected ? undefined : "Informe o nome.",
          category: "Escolha a categoria.",
        }),
      { initialProps: { selected: false } },
    );
    act(() => {
      result.current.validate();
    });
    rerender({ selected: true });
    result.current.field("category").registerFocus(focus);
    expect(result.current.field("category").summary).toBeTruthy();
    act(() => {
      result.current.validate();
      result.current.validate();
    });
    expect(focus).toHaveBeenCalledTimes(2);
  });

  it("ignores inactive conditional fields and does not focus an unmounted field", () => {
    const focus = vi.fn();
    const { result } = renderHook(() =>
      useFormValidation({
        name: undefined,
        delivery: false,
        category: "Escolha a categoria.",
      }),
    );
    const unregister = result.current.field("category").registerFocus(focus);
    unregister();
    act(() => {
      expect(result.current.validate()).toBe(false);
    });
    expect(focus).not.toHaveBeenCalled();
    expect(result.current.field("delivery").error).toBeUndefined();
  });
});
