import { describe, expect, it, vi } from "vitest";

vi.mock("../components/app-icon", () => ({ AppIcon: () => null }));
vi.mock("./use-desktop-layout", () => ({ useDesktopLayout: () => false }));

import { desktopWidths } from "./desktop-density";
import { desktopAsideWidth, desktopColumns, desktopPageContent } from "./desktop-page";

describe("desktop page primitives", () => {
  it("keeps mobile content styles untouched", () => {
    expect(desktopPageContent(false)).toBeUndefined();
  });

  it("caps the page at the shared widths", () => {
    expect(desktopPageContent(true)).toMatchObject({ maxWidth: desktopWidths.page });
    expect(desktopPageContent(true, "form")).toMatchObject({
      maxWidth: desktopWidths.form,
    });
  });

  it("fits as many columns as the minimum width allows", () => {
    // Coluna principal de Nova venda em 1440px: 728px, cartões de 196px.
    expect(desktopColumns(728, 196, 16, 4)).toEqual({ columns: 3, itemWidth: 232 });
    expect(desktopColumns(392, 196, 16, 4).columns).toBe(1);
    expect(desktopColumns(2000, 196, 16, 4).columns).toBe(4);
    expect(desktopColumns(0, 196, 16, 4)).toEqual({ columns: 1, itemWidth: 0 });
  });

  it("narrows the aside on small desktops without hiding it", () => {
    expect(desktopAsideWidth(1200)).toBe(360);
    expect(desktopAsideWidth(704)).toBe(280);
    expect(desktopAsideWidth(0)).toBe(360);
  });
});
