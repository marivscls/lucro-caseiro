import { act, renderHook } from "@testing-library/react";
import type React from "react";
import {
  Keyboard,
  ScrollView,
  TextInput,
  type KeyboardEvent,
  type MeasureInWindowOnSuccessCallback,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  scrollInputIntoVisibleArea,
  useScrollFocusedInputIntoView,
} from "./keyboard-aware-scroll-view";

type FocusedInput = NonNullable<
  ReturnType<typeof TextInput.State.currentlyFocusedInput>
>;
type NativeScrollRef = NonNullable<
  ReturnType<ScrollView["getNativeScrollRef"]>
>;

function measuredInput(top: number, height: number): FocusedInput {
  return {
    measureInWindow: (callback: MeasureInWindowOnSuccessCallback) =>
      callback(0, top, 320, height),
  } as unknown as FocusedInput;
}

function measuredScrollView(top: number, height: number): NativeScrollRef {
  return {
    measureInWindow: (callback: MeasureInWindowOnSuccessCallback) =>
      callback(0, top, 360, height),
  } as unknown as NativeScrollRef;
}

describe("scrollInputIntoVisibleArea", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves the whole input above the real bottom of the scroll viewport", () => {
    const scrollTo = vi.fn();

    scrollInputIntoVisibleArea(
      {
        getNativeScrollRef: () => measuredScrollView(100, 400),
        scrollTo,
      },
      measuredInput(450, 60),
      200,
      24,
    );

    expect(scrollTo).toHaveBeenCalledWith({ y: 234, animated: true });
  });

  it("does not move an input whose full rectangle is already visible", () => {
    const scrollTo = vi.fn();

    scrollInputIntoVisibleArea(
      {
        getNativeScrollRef: () => measuredScrollView(100, 400),
        scrollTo,
      },
      measuredInput(200, 60),
      200,
      24,
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("moves an input down when its top is clipped by the modal header", () => {
    const scrollTo = vi.fn();

    scrollInputIntoVisibleArea(
      {
        getNativeScrollRef: () => measuredScrollView(100, 400),
        scrollTo,
      },
      measuredInput(110, 60),
      200,
      24,
    );

    expect(scrollTo).toHaveBeenCalledWith({ y: 186, animated: true });
  });

  it("does nothing before the scroll view or focused field is available", () => {
    const scrollTo = vi.fn();

    scrollInputIntoVisibleArea(null, undefined, 0, 24);
    scrollInputIntoVisibleArea(
      { getNativeScrollRef: () => null, scrollTo },
      undefined,
      0,
      24,
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("remeasures after Android finishes resizing for the keyboard", () => {
    const scrollTo = vi.fn();
    const focusedInput = measuredInput(450, 60);
    const scrollViewRef = {
      current: {
        getNativeScrollRef: () => measuredScrollView(100, 400),
        scrollTo,
      },
    } as unknown as React.RefObject<ScrollView | null>;
    let keyboardDidShow: ((event: KeyboardEvent) => void) | undefined;
    const remove = vi.fn();

    vi.mocked(Keyboard.addListener).mockImplementation((_event, listener) => {
      keyboardDidShow = listener;
      return { remove } as unknown as ReturnType<typeof Keyboard.addListener>;
    });
    vi.spyOn(TextInput.State, "currentlyFocusedInput").mockReturnValue(focusedInput);
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => undefined);

    const { result, unmount } = renderHook(() =>
      useScrollFocusedInputIntoView(scrollViewRef, 24),
    );

    act(() => {
      result.current.trackScroll({
        nativeEvent: { contentOffset: { y: 200 } },
      } as NativeSyntheticEvent<NativeScrollEvent>);
      keyboardDidShow?.({} as KeyboardEvent);
    });

    expect(Keyboard.addListener).toHaveBeenCalledWith(
      "keyboardDidShow",
      expect.any(Function),
    );
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenCalledWith({ y: 234, animated: true });

    unmount();
    expect(remove).toHaveBeenCalledOnce();
  });
});
