import type { Supplier } from "@lucro-caseiro/contracts";
import { fonts, radii, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, Text, View } from "react-native";

import { supplierInitials, supplierInitialsBackground } from "../domain";
import { supplierPreset } from "../illustration-presets";
import { SupplierIllustration } from "./supplier-illustration";

export function SupplierAvatar({
  supplier,
  size = 64,
}: Readonly<{
  supplier: Pick<Supplier, "name" | "avatarType" | "avatarPresetId" | "avatarUrl">;
  size?: number;
}>) {
  const { theme } = useTheme();
  const preset = supplierPreset(supplier.avatarPresetId);

  if (supplier.avatarType === "upload" && supplier.avatarUrl) {
    return (
      <Image
        source={{ uri: supplier.avatarUrl }}
        resizeMode="cover"
        accessibilityLabel={`Imagem de ${supplier.name}`}
        style={{
          width: size,
          height: size,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
        }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={preset ? preset.label : `Iniciais de ${supplier.name}`}
      style={{
        width: size,
        height: size,
        borderRadius: radii.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          preset?.backgroundColor ?? supplierInitialsBackground(supplier.name),
      }}
    >
      {preset ? (
        <SupplierIllustration
          name={preset.illustration}
          size={Math.round(size * 0.46)}
          color="#7A3641"
        />
      ) : (
        <Text
          style={{
            color: theme.colors.primaryStrong,
            fontFamily: fonts.bold,
            fontSize: Math.round(size * 0.3),
          }}
        >
          {supplierInitials(supplier.name)}
        </Text>
      )}
    </View>
  );
}
