import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAppAlert } from "../components/alert-store";
import { useImagePicker } from "./use-image-picker";

describe("useImagePicker", () => {
  it("imageUri starts as null", () => {
    const { result } = renderHook(() => useImagePicker());
    expect(result.current.imageUri).toBeNull();
  });

  it("setImageUri updates the state", () => {
    const { result } = renderHook(() => useImagePicker());

    act(() => {
      result.current.setImageUri("file://test.jpg");
    });

    expect(result.current.imageUri).toBe("file://test.jpg");
  });

  it("clear resets imageUri to null", () => {
    const { result } = renderHook(() => useImagePicker());

    act(() => {
      result.current.setImageUri("file://test.jpg");
    });
    expect(result.current.imageUri).toBe("file://test.jpg");

    act(() => {
      result.current.clear();
    });
    expect(result.current.imageUri).toBeNull();
  });

  it("showPicker opens the app alert with 3 options", () => {
    const { result } = renderHook(() => useImagePicker());

    act(() => {
      result.current.showPicker();
    });

    const options = useAppAlert.getState().options;
    expect(options?.title).toBe("Adicionar foto");
    expect(options?.buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "Tirar foto" }),
        expect.objectContaining({ text: "Escolher da galeria" }),
        expect.objectContaining({ text: "Cancelar", style: "cancel" }),
      ]),
    );
  });

  it("exposes all expected functions", () => {
    const { result } = renderHook(() => useImagePicker());

    expect(typeof result.current.showPicker).toBe("function");
    expect(typeof result.current.pickFromGallery).toBe("function");
    expect(typeof result.current.takePhoto).toBe("function");
    expect(typeof result.current.clear).toBe("function");
    expect(typeof result.current.setImageUri).toBe("function");
  });
});
