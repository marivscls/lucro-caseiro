import type { Purchase } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  IconButton,
  Typography,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { formatCurrency } from "../../../shared/utils/format";
import { displayProductName } from "../../products/display";
import { useSupplierName } from "../../suppliers/hooks";
import { useBusinessCopy } from "../../subscription/business-copy";
import { categoryLabel, formatPurchaseItemsLine } from "../domain";

interface PurchaseCardProps {
  readonly purchase: Purchase;
  readonly onPay: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly isPaying?: boolean;
  readonly payDisabled?: boolean;
  readonly isDeleting?: boolean;
  readonly deleteDisabled?: boolean;
  readonly editDisabled?: boolean;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PurchaseCard({
  purchase,
  onPay,
  onEdit,
  onDelete,
  isPaying,
  payDisabled,
  isDeleting,
  deleteDisabled,
  editDisabled,
}: PurchaseCardProps) {
  const pal = useBrandScreenPalette();
  const experienceCopy = useBusinessCopy();
  const supplierName = useSupplierName(purchase.supplierId);
  const isPaid = purchase.paymentStatus === "paid";
  const itemsLine = formatPurchaseItemsLine(purchase.items, displayProductName);
  const category = purchaseCategoryLabel(
    purchase.category,
    experienceCopy.materialNoun,
    experienceCopy.packagingNoun,
  );
  const metaParts = [supplierName, category, formatDate(purchase.purchasedAt)].filter(
    (part): part is string => Boolean(part),
  );

  return (
    <Card
      variant="elevated"
      shadow="sm"
      padding="lg"
      style={{
        backgroundColor: pal.white,
        borderWidth: 0,
        borderRadius: radii.xl,
      }}
    >
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Typography
            variant="bodyBold"
            color={pal.ink}
            numberOfLines={2}
            style={{ flex: 1, minWidth: 0 }}
          >
            {purchase.description}
          </Typography>
          <Typography
            variant="bodyBold"
            color={pal.ink}
            numberOfLines={1}
            style={{
              flexShrink: 0,
              maxWidth: "42%",
              textAlign: "right",
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatCurrency(purchase.amount)}
          </Typography>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Typography
            variant="caption"
            color={pal.muted}
            numberOfLines={2}
            style={{ flex: 1, minWidth: 0 }}
          >
            {metaParts.join(" · ")}
          </Typography>
          <PurchaseStatusChip paid={isPaid} />
        </View>

        {itemsLine ? (
          <Typography variant="caption" color={pal.ink} numberOfLines={2}>
            {itemsLine}
          </Typography>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginTop: spacing.xs,
          }}
        >
          {!isPaid ? (
            <Button
              title="Marcar como paga"
              size="md"
              onPress={onPay}
              loading={isPaying}
              disabled={payDisabled}
              style={{
                alignSelf: "flex-start",
                backgroundColor: pal.rose,
                minHeight: 44,
                paddingHorizontal: spacing.lg,
              }}
            />
          ) : null}

          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <IconButton
              size={44}
              icon={
                <AppIcon name="pencil-outline" size={iconSizes.sm} color={pal.wine} />
              }
              onPress={onEdit}
              disabled={editDisabled}
              accessibilityLabel="Editar compra"
              style={{
                backgroundColor: pal.surface,
                borderWidth: 0,
                opacity: editDisabled ? 0.55 : 1,
              }}
            />
            <IconButton
              size={44}
              icon={
                isDeleting ? (
                  <ActivityIndicator size="small" color={pal.wine} />
                ) : (
                  <AppIcon name="trash-outline" size={iconSizes.sm} color={pal.wine} />
                )
              }
              onPress={onDelete}
              disabled={deleteDisabled}
              accessibilityLabel={isDeleting ? "Excluindo compra" : "Excluir compra"}
              style={{
                backgroundColor: pal.surface,
                borderWidth: 0,
                opacity: deleteDisabled && !isDeleting ? 0.55 : 1,
              }}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

function PurchaseStatusChip({ paid }: Readonly<{ paid: boolean }>) {
  const pal = useBrandScreenPalette();
  const { theme } = useTheme();
  let backgroundColor = pal.surface;
  if (!paid && theme.mode === "light") {
    backgroundColor = "rgba(220, 232, 106, 0.38)";
  }
  const textColor = paid ? pal.wine : pal.ink;

  return (
    <View
      style={{
        flexShrink: 0,
        minHeight: 24,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.sm,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="captionBold" color={textColor}>
        {paid ? "Pago" : "A pagar"}
      </Typography>
    </View>
  );
}

function purchaseCategoryLabel(
  category: string,
  materialNoun: string,
  packagingNoun: string,
): string {
  if (category === "material") return capitalize(materialNoun);
  if (category === "packaging") return capitalize(packagingNoun);
  return categoryLabel(category);
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}
