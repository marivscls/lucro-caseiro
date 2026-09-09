import React from "react";
import { Button } from "@lucro-caseiro/ui";
import { canUseQuickSale } from "../cart";

interface QuickSaleButtonProps {
  readonly itemCount: number;
  readonly hasClient: boolean;
  readonly pending: boolean;
  readonly onConfirm: (paymentMethod: "cash") => void;
}
export function QuickSaleButton({
  itemCount,
  hasClient,
  pending,
  onConfirm,
}: QuickSaleButtonProps) {
  if (!canUseQuickSale(itemCount, hasClient)) return null;
  return (
    <Button
      title="Venda rápida no dinheiro"
      variant="text"
      size="lg"
      loading={pending}
      onPress={() => onConfirm("cash")}
    />
  );
}
