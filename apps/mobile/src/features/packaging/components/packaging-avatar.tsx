import React from "react";

import { displayIngredientName } from "../../../shared/ingredient-image/resolve";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { packagingIllustrationSlug, typeEmoji, typeSurfaceColor } from "../domain";

interface PackagingAvatarProps {
  readonly name: string;
  readonly type: string;
  readonly photoUrl?: string | null;
  readonly size?: number;
}

/**
 * Avatar da embalagem: usa a foto enviada quando existe; senão, busca a
 * ilustração pelo slug único do nome (não repete a mesma miniatura entre
 * produtos). Sem imagem, cai no emoji + fundo da categoria.
 */
export function PackagingAvatar({
  name,
  type,
  photoUrl,
  size = 52,
}: PackagingAvatarProps) {
  const displayName = displayIngredientName(name);
  return (
    <IngredientAvatar
      name={displayName}
      size={size}
      photoUrl={photoUrl}
      matchCatalog={false}
      illustrationSlug={packagingIllustrationSlug(name)}
      fallbackEmoji={typeEmoji(type)}
      fallbackColor={typeSurfaceColor(type)}
      imageResizeMode="contain"
      accessibilityLabel={displayName}
    />
  );
}
