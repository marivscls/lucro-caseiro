import { getActiveBrand } from "@lucro-caseiro/brands";

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) {
    throw new Error(`Cor de marca invalida: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function mix(hex: string, target: Rgb, amount: number): string {
  const source = parseHex(hex);
  const channel = (index: number) =>
    Math.round(source[index]! + (target[index]! - source[index]!) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/** Generate the web brand scale from its canonical 500 color. */
export function createBrandScale(primary: string): Record<string, string> {
  const white: Rgb = [255, 255, 255];
  const black: Rgb = [0, 0, 0];
  return {
    "50": mix(primary, white, 0.9),
    "100": mix(primary, white, 0.82),
    "200": mix(primary, white, 0.65),
    "300": mix(primary, white, 0.45),
    "400": mix(primary, white, 0.22),
    "500": primary,
    "600": mix(primary, black, 0.1),
    "700": mix(primary, black, 0.2),
    "800": mix(primary, black, 0.35),
    "900": mix(primary, black, 0.5),
  };
}

export function BrandThemeStyle() {
  const { theme } = getActiveBrand();
  const scale = createBrandScale(theme.primary);
  const vars: Record<string, string | undefined> = {
    ...Object.fromEntries(
      Object.entries(scale).map(([step, value]) => [`--rose-${step}`, value]),
    ),
    "--primary": theme.primary,
    "--primary-light": theme.primaryLight,
    "--primary-strong": theme.primaryStrong ?? theme.primaryDark,
    "--primary-interactive": theme.primaryInteractive ?? theme.primaryDark,
    "--primary-soft": theme.primarySoft,
    "--background": theme.background,
    "--surface": theme.surface,
    "--background-dark": theme.backgroundDark,
    "--surface-dark": theme.surfaceDark,
  };

  const css = Object.entries(vars)
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  return (
    <style
      id="brand-theme-overrides"
      dangerouslySetInnerHTML={{ __html: `:root {\n${css}\n}` }}
    />
  );
}
