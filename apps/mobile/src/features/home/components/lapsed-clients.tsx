import type { Client } from "@lucro-caseiro/contracts";
import { spacing } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { AppIcon } from "../../../shared/components/app-icon";
import { openWhatsApp } from "../../../shared/utils/whatsapp";
import { lapsedClientMessage, lapsedClients, lastPurchaseLabel } from "../lapsed-clients";
import { HomeCard, T, useHomeColors, type Query, type SalesPage } from "./parts";
import { styles } from "./styles";

/**
 * "Clientes que sumiram": até 3 clientes de costume (2+ compras nos últimos
 * 180 dias) sem comprar há 30 dias ou mais, com atalho para o WhatsApp.
 * Como é um convite e não um número, não ocupa espaço enquanto carrega,
 * quando falha ou quando ninguém sumiu.
 */
export function HomeLapsedClients({
  sales,
  clients,
  now,
  businessName,
  service,
  style,
}: Readonly<{
  sales: Query<SalesPage>;
  clients: Query<{ items: Client[] }>;
  now: Date;
  businessName?: string | null;
  service: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const colors = useHomeColors();
  if (!sales.data || !clients.data) return null;
  const list = lapsedClients(clients.data.items, sales.data.items, now);
  if (list.length === 0) return null;
  return (
    <HomeCard style={[{ padding: spacing.xl, gap: 4 }, style]}>
      <T style={styles.sectionTitle} accessibilityRole="header">
        Clientes que sumiram
      </T>
      <T style={[styles.caption15, { paddingBottom: spacing.sm }]} color={colors.muted}>
        Compravam sempre e não compram há 30 dias ou mais. Um oi pode trazer de volta.
      </T>
      {list.map((client) => (
        <View
          key={client.clientId}
          style={[styles.listRow, { borderColor: colors.border }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.softRose }]}>
            <T style={styles.bodyStrong} color={colors.wine}>
              {client.name.charAt(0).toUpperCase()}
            </T>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T style={styles.bodyBold} numberOfLines={1}>
              {client.name}
            </T>
            <T style={styles.caption} color={colors.muted}>
              {lastPurchaseLabel(client.daysAway)}
            </T>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chamar ${client.name} no WhatsApp`}
            onPress={() =>
              void openWhatsApp(
                client.phone,
                lapsedClientMessage({ clientName: client.name, businessName, service }),
              )
            }
            style={({ pressed }) => [
              styles.whatsapp,
              {
                marginTop: 0,
                paddingHorizontal: 14,
                borderColor: colors.border,
                backgroundColor: colors.white,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <AppIcon name="logo-whatsapp" size={18} color={colors.green} />
            <T style={styles.bodyBold} color={colors.green}>
              Chamar
            </T>
          </Pressable>
        </View>
      ))}
    </HomeCard>
  );
}
