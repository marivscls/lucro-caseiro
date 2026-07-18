// Cores pastel para avatares de clientes: fundo claro + texto escuro no tema
// claro; fundo escuro dessaturado + texto claro no tema escuro. A cor é
// derivada do nome (hash), então é estável entre renderizações e sessões.

type AvatarPastel = { bg: string; fg: string };
type AvatarMode = "light" | "dark";

const AVATAR_PASTELS: Record<AvatarMode, AvatarPastel[]> = {
  light: [
    { bg: "#FDE8E8", fg: "#B64545" },
    { bg: "#FDEFE3", fg: "#B06A33" },
    { bg: "#FDF6DC", fg: "#9C7E26" },
    { bg: "#E8F6E4", fg: "#4E8A44" },
    { bg: "#E2F4EF", fg: "#3B8A77" },
    { bg: "#E3EFFB", fg: "#3E6FA8" },
    { bg: "#EBE6FA", fg: "#6B53A8" },
    { bg: "#F9E6F3", fg: "#A8488C" },
    { bg: "#F0EAE0", fg: "#8A7350" },
    { bg: "#E6F2F8", fg: "#3F7C99" },
  ],
  dark: [
    { bg: "#4A2A2C", fg: "#F0AFAF" },
    { bg: "#463322", fg: "#EBBE93" },
    { bg: "#453F22", fg: "#E3D28A" },
    { bg: "#27392A", fg: "#A8D8A0" },
    { bg: "#1F3A34", fg: "#96D4C5" },
    { bg: "#22334A", fg: "#9FC2EC" },
    { bg: "#32294A", fg: "#C0AEEC" },
    { bg: "#43263C", fg: "#E8A8D4" },
    { bg: "#3B332A", fg: "#D4C09E" },
    { bg: "#233B46", fg: "#9CC9DE" },
  ],
};

export function avatarPastel(label: string, mode: AvatarMode = "light") {
  const text = label.trim() || "?";
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PASTELS[mode][hash % AVATAR_PASTELS.light.length];
}
