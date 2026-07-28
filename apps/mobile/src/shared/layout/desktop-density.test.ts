import { describe, expect, it } from "vitest";

import {
  desktopAction,
  desktopCompactField,
  desktopContained,
  desktopSplitLayout,
  desktopStretch,
  desktopWidths,
  pageGutter,
  responsiveModalPresentation,
} from "./desktop-density";

describe("desktop density", () => {
  it("keeps mobile styles untouched", () => {
    expect(desktopContained(false)).toBeUndefined();
    expect(desktopStretch(false)).toBeUndefined();
    expect(desktopAction(false)).toBeUndefined();
    expect(desktopCompactField(false)).toBeUndefined();
    expect(desktopSplitLayout(false)).toEqual({
      outer: undefined,
      row: undefined,
      main: undefined,
      aside: undefined,
    });
    expect(pageGutter(false)).toEqual({ paddingHorizontal: 20 });
    expect(pageGutter(false, 16)).toEqual({ paddingHorizontal: 16 });
  });

  it("zeros page gutter on desktop so the shell owns the edge", () => {
    expect(pageGutter(true)).toEqual({ paddingHorizontal: 0 });
    expect(pageGutter(true, 16)).toEqual({ paddingHorizontal: 0 });
  });

  it("applies the canonical desktop limits", () => {
    expect(desktopContained(true)).toEqual({
      alignSelf: "center",
      maxWidth: desktopWidths.form,
      width: "100%",
    });
    expect(desktopStretch(true)).toEqual({
      alignSelf: "stretch",
      maxWidth: desktopWidths.data,
      width: "100%",
    });
    expect(desktopAction(true)).toEqual({
      alignSelf: "flex-end",
      minHeight: 44,
      width: 220,
    });
    expect(desktopCompactField(true)).toEqual({
      maxWidth: desktopWidths.compact,
      width: "100%",
    });
  });

  it("builds a form + sticky aside split on desktop", () => {
    const split = desktopSplitLayout(true);
    expect(split.outer).toEqual({
      alignSelf: "stretch",
      maxWidth: desktopWidths.data,
      width: "100%",
    });
    expect(split.row?.flexDirection).toBe("row");
    expect(split.main?.flex).toBe(1);
    expect(split.aside).toMatchObject({
      width: 400,
      position: "sticky",
      top: 0,
    });
  });

  it("keeps native modal presentation on mobile", () => {
    expect(
      responsiveModalPresentation(false, {
        animationType: "slide",
        presentationStyle: "pageSheet",
        transparent: false,
      }),
    ).toEqual({
      animationType: "slide",
      presentationStyle: "pageSheet",
      transparent: false,
    });
  });

  it("uses a regular web modal presentation on desktop", () => {
    expect(
      responsiveModalPresentation(true, {
        animationType: "slide",
        presentationStyle: "pageSheet",
        transparent: false,
      }),
    ).toEqual({
      animationType: "fade",
      presentationStyle: "overFullScreen",
      transparent: true,
    });
  });
});
