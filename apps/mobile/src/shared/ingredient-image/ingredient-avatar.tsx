import React, { useState } from "react";
import { Image, Text, View } from "react-native";

import { requestImageGeneration } from "./generation";
import { ingredientImageUrl } from "./image-manifest";
import { resolveIngredient, slugify } from "./resolve";

interface IngredientAvatarProps {
  /** Nome livre do insumo/produto/receita (ex.: "Leite condensado", "Lasanha"). */
  readonly name: string;
  readonly size?: number;
  /** Foto explícita (ex.: foto da receita enviada pelo usuário) — tem prioridade sobre tudo. */
  readonly photoUrl?: string | null;
  /**
   * Emoji escolhido manualmente pelo usuário (ex.: ícone do insumo). Tem prioridade
   * sobre a resolução por nome/imagem — mostra esse emoji (a menos que haja `photoUrl`).
   */
  readonly emoji?: string | null;
  /** Fallback quando o nome não está no catálogo (ex.: ícone/cor da categoria da receita). */
  readonly fallbackEmoji?: string;
  readonly fallbackColor?: string;
  /**
   * Casar com o catálogo de insumos (default true). Use `false` para nomes de
   * **prato/receita** (ex.: "Torta de limão" não deve virar o insumo limão).
   */
  readonly matchCatalog?: boolean;
}

const FALLBACK_COLOR = "#9A8F87";
const FALLBACK_EMOJI = "🍽️";

/**
 * Avatar circular dinâmico: resolve a ilustração pelo **slug do nome** (qualquer
 * nome, não só o catálogo). Mostra o PNG publicado quando existe; senão, o
 * fallback (emoji + cor). Em miss de imagem, pede a geração (no-op até configurar).
 */
export function IngredientAvatar({
  name,
  size = 50,
  photoUrl,
  emoji,
  fallbackEmoji,
  fallbackColor,
  matchCatalog = true,
}: IngredientAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const chosen = emoji?.trim() ? emoji.trim() : null;
  const entry = matchCatalog ? resolveIngredient(name) : null;
  const slug = entry?.slug ?? slugify(name);
  const color = entry?.color ?? fallbackColor ?? FALLBACK_COLOR;
  const displayEmoji = chosen ?? entry?.emoji ?? fallbackEmoji ?? FALLBACK_EMOJI;
  // Prioridade: foto explícita > emoji escolhido > PNG publicado por slug > fallback.
  const url = photoUrl ?? (chosen ? "" : ingredientImageUrl(slug));
  const showImage = Boolean(url) && !imageFailed;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}33`,
        borderWidth: 1,
        borderColor: `${color}55`,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => {
            setImageFailed(true);
            requestImageGeneration(slug, entry?.label ?? name);
          }}
        />
      ) : (
        <Text style={{ fontSize: size * 0.46 }}>{displayEmoji}</Text>
      )}
    </View>
  );
}
