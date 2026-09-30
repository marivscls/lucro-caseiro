/** Accept explicit decimal formats without silently removing typed characters. */
export function parseDecimalInput(text: string): number {
  const value = text.trim();
  if (value === "") return 0;
  if (value.length > 32) return Number.NaN;
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const comma = unsigned.split(",");
  if (comma.length > 2) return Number.NaN;
  const integer = comma[0] ?? "";
  const fraction = comma[1] ?? "";
  if (comma.length === 2 && integer.includes(".")) {
    const groups = integer.split(".");
    if (
      !groups.every(
        (group, index) =>
          /^\d+$/.test(group) && (index === 0 ? group.length <= 3 : group.length === 3),
      ) ||
      !/^\d+$/.test(fraction)
    )
      return Number.NaN;
    return Number((negative ? "-" : "") + groups.join("") + "." + fraction);
  }
  const normalized = unsigned.replace(",", ".");
  const parts = normalized.split(".");
  if (
    parts.length > 2 ||
    !parts.every((part) => /^\d*$/.test(part)) ||
    !parts.some((part) => part.length > 0)
  )
    return Number.NaN;
  return Number((negative ? "-" : "") + normalized);
}
