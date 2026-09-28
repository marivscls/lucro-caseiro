import type { SaleUnit } from "@lucro-caseiro/contracts";
import React from "react";

import { ChoiceField, FormField } from "../../../shared/components/form-field";

interface SaleUnitToggleProps {
  readonly value: SaleUnit;
  readonly onChange: (value: SaleUnit) => void;
}

/**
 * Alternador de unidade de venda: por unidade ou por quilo (R$/kg).
 * Quando "kg", o preco de venda representa o preco por quilo.
 */
export function SaleUnitToggle({ value, onChange }: SaleUnitToggleProps) {
  return (
    <FormField label="Como você vende?" span="full">
      <ChoiceField<SaleUnit>
        accessibilityLabel="Como você vende?"
        value={value}
        onChange={onChange}
        options={[
          { value: "unit", label: "Por unidade", icon: "cube-outline" },
          { value: "kg", label: "Por quilo (kg)", icon: "scale-outline" },
        ]}
      />
    </FormField>
  );
}
