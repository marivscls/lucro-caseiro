"use client";

import { getActiveBrand, type BrandConfig } from "@lucro-caseiro/brands";
import { createContext, useContext, type ReactNode } from "react";

/**
 * Provider de marca do web (whitelabel, ADR-0009). Espelha o
 * BrandProvider do @lucro-caseiro/ui, que nao pode ser importado aqui:
 * o index do ui re-exporta componentes React Native e o web nao tem
 * react-native como peer. Manter em sincronia com
 * packages/ui/src/theme-context.tsx.
 */
const BrandContext = createContext<BrandConfig>(getActiveBrand());

export function BrandProvider({
  children,
  brand,
}: {
  children: ReactNode;
  brand?: BrandConfig;
}) {
  return (
    <BrandContext.Provider value={brand ?? getActiveBrand()}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}

/** Atalho: a feature flag esta ligada na marca ativa? */
export function useFeature(flag: string): boolean {
  const brand = useContext(BrandContext);
  return brand.features[flag] ?? false;
}
