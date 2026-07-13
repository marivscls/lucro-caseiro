/** Inicial visual do produto, ignorando prefixos técnicos como "[massa]". */
export function productInitial(name: string): string {
  const visibleName = name.replace(/^\[[^\]]+\]\s*/, "").trim() || name.trim();
  return visibleName.charAt(0).toUpperCase() || "P";
}
