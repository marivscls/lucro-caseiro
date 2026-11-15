import type { Order } from "@lucro-caseiro/contracts";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Linking, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { catalogOrderConfirmUrl } from "../domain";

/**
 * Aviso no topo da encomenda que veio da vitrine: quem pediu, o telefone e um
 * botão para confirmar pelo WhatsApp com a mensagem pronta.
 */
export function CatalogOrderBanner({ order }: { readonly order: Order }) {
  const { theme } = useTheme();
  const url = catalogOrderConfirmUrl(order);

  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: theme.colors.blueBg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name="storefront-outline" size={20} color={theme.colors.blue} />
        <Typography variant="bodyBold" color={theme.colors.blue}>
          Pedido feito pelo catálogo
        </Typography>
      </View>
      <Typography variant="body">
        {order.customerName ?? "Cliente"}
        {order.customerPhone ? ` · ${order.customerPhone}` : ""}
      </Typography>
      {url ? (
        <Button
          title="Confirmar pelo WhatsApp"
          variant="outline"
          onPress={() => {
            void Linking.openURL(url).catch(() =>
              showAlert({
                title: "Não foi possível abrir o WhatsApp",
                message: `Chame a cliente pelo número ${order.customerPhone ?? ""}.`,
              }),
            );
          }}
        />
      ) : null}
    </View>
  );
}
