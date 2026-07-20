import { describe, expect, it } from "vitest";

import { hugModalSafeAreaStyle } from "./responsive-modal-surface";

describe("hugModalSafeAreaStyle", () => {
  it("keeps every mobile bottom sheet above the system navigation area", () => {
    expect(hugModalSafeAreaStyle(false, 34)).toEqual({
      padding: 0,
      paddingBottom: 34,
    });
  });

  it("preserves the canonical desktop dialog padding", () => {
    expect(hugModalSafeAreaStyle(true, 34)).toEqual({
      padding: 24,
      paddingBottom: 24,
    });
  });
});
