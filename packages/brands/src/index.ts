import { lucroCaseiroBrand } from "./lucro-caseiro";
import { lucroManicureBrand } from "./lucro-manicure";
import { lucroObraBrand } from "./lucro-obra";
import { lucroOficinaBrand } from "./lucro-oficina";
import { lucroPapelariaBrand } from "./lucro-papelaria";
import { lucroRevendaBrand } from "./lucro-revenda";

declare const process: {
  readonly env: {
    readonly BRAND?: string;
    readonly EXPO_PUBLIC_BRAND?: string;
    readonly NEXT_PUBLIC_BRAND?: string;
  };
};

export type {
  BrandAdMobConfig,
  BrandConfig,
  BrandCopy,
  BrandFeatures,
  BrandOnboardingConfig,
  BrandThemeOverrides,
  BrandVerticalConfig,
  VerticalDomain,
} from "./types";

export const DEFAULT_BRAND_ID = "lucro-caseiro";

export const brands = {
  [lucroCaseiroBrand.id]: lucroCaseiroBrand,
  [lucroManicureBrand.id]: lucroManicureBrand,
  [lucroObraBrand.id]: lucroObraBrand,
  [lucroOficinaBrand.id]: lucroOficinaBrand,
  [lucroPapelariaBrand.id]: lucroPapelariaBrand,
  [lucroRevendaBrand.id]: lucroRevendaBrand,
} as const;

export type BrandId = keyof typeof brands;

export function resolveBrand(id: string) {
  const brand = brands[id as BrandId];
  if (!brand) {
    throw new Error(
      `Marca desconhecida: ${id}. Marcas disponiveis: ${Object.keys(brands).join(", ")}.`,
    );
  }
  return brand;
}

export function getActiveBrand() {
  const id =
    process.env.BRAND?.trim() ||
    process.env.EXPO_PUBLIC_BRAND?.trim() ||
    process.env.NEXT_PUBLIC_BRAND?.trim() ||
    DEFAULT_BRAND_ID;
  return resolveBrand(id);
}
