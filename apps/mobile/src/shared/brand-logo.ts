import type { ThemeMode } from "@lucro-caseiro/ui";
import type { ImageSourcePropType } from "react-native";

import caseiroLogo from "../assets/auth-house.png";
import caseiroLogoLight from "../assets/auth-house-light.png";
import manicureLogo from "../../../../packages/brands/lucro-manicure/assets/icon.png";
import obraLogo from "../../../../packages/brands/lucro-obra/assets/icon.png";
import oficinaLogo from "../../../../packages/brands/lucro-oficina/assets/icon.png";
import papelariaLogo from "../../../../packages/brands/lucro-papelaria/assets/icon.png";
import revendaLogo from "../../../../packages/brands/lucro-revenda/assets/icon.png";

const brandLogoById: Readonly<Record<string, ImageSourcePropType>> = {
  "lucro-caseiro": caseiroLogo,
  "lucro-manicure": manicureLogo,
  "lucro-obra": obraLogo,
  "lucro-oficina": oficinaLogo,
  "lucro-papelaria": papelariaLogo,
  "lucro-revenda": revendaLogo,
};

export const brandLogoByMode: Readonly<
  Record<ThemeMode, Readonly<Record<string, ImageSourcePropType>>>
> = {
  dark: brandLogoById,
  light: { ...brandLogoById, "lucro-caseiro": caseiroLogoLight },
};
