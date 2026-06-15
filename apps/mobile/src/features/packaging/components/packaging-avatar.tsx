import { useTheme } from "@lucro-caseiro/ui";
import React from "react";

import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { typeColor, typeEmoji } from "../domain";

interface PackagingAvatarProps {
  readonly name: string;
  readonly type: string;
  readonly photoUrl?: string | null;
  readonly size?: number;
}

/**
 * Avatar da embalagem: usa a foto enviada quando existe; senão, cai no emoji +
 * cor do tipo (caixa/sacola/pote/...). Não casa com o catálogo de insumos.
 */
export function PackagingAvatar({
  name,
  type,
  photoUrl,
  size = 52,
}: PackagingAvatarProps) {
  const { theme } = useTheme();
  return (
    <IngredientAvatar
      name={name}
      size={size}
      photoUrl={photoUrl}
      matchCatalog={false}
      fallbackEmoji={typeEmoji(type)}
      fallbackColor={typeColor(theme, type)}
    />
  );
}
