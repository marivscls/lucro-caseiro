import type { ImageSourcePropType } from "react-native";

import caseiroLogo from "../assets/auth-house.png";
import manicureLogo from "../../../../packages/brands/lucro-manicure/assets/icon.png";
import papelariaLogo from "../../../../packages/brands/lucro-papelaria/assets/icon.png";

export const brandLogoById: Readonly<Record<string, ImageSourcePropType>> = {
  "lucro-caseiro": caseiroLogo,
  "lucro-manicure": manicureLogo,
  "lucro-papelaria": papelariaLogo,
};
