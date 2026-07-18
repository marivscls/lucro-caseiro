import { describe, expect, it } from "vitest";

import {
  desktopAction,
  desktopContained,
  desktopWidths,
  responsiveModalPresentation,
} from "./desktop-density";

describe("desktop density", () => {
  it("keeps mobile styles untouched", () => {
    expect(desktopContained(false)).toBeUndefined();
    expect(desktopAction(false)).toBeUndefined();
  });

  it("applies the canonical desktop limits", () => {
    expect(desktopContained(true)).toEqual({
      alignSelf: "center",
      maxWidth: desktopWidths.form,
      width: "100%",
    });
    expect(desktopAction(true)).toEqual({
      alignSelf: "flex-end",
      minHeight: 44,
      width: 220,
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
