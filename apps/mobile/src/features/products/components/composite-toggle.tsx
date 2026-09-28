import React from "react";

import { ChoiceField, FormField } from "../../../shared/components/form-field";

interface CompositeToggleProps {
  /** true = produto composto (kit); false = produto simples. */
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
  /**
   * Quando true, a opção "Produto composto (kit)" é exibida com um cadeado
   * (recurso Profissional). O toque ainda dispara `onChange(true)` — quem
   * chama decide se abre o paywall em vez de marcar a opção.
   */
  readonly locked?: boolean;
}

/**
 * Alternador entre produto simples e produto composto (kit/caixinha).
 * Um kit e montado a partir de outros produtos; o custo total e a soma dos
 * componentes.
 */
export function CompositeToggle({
  value,
  onChange,
  locked = false,
}: CompositeToggleProps) {
  return (
    <FormField label="Que tipo de produto é?" span="full">
      <ChoiceField<"simple" | "kit">
        accessibilityLabel="Que tipo de produto é?"
        value={value ? "kit" : "simple"}
        onChange={(next) => onChange(next === "kit")}
        options={[
          { value: "simple", label: "Simples", icon: "cube-outline" },
          { value: "kit", label: "Kit", icon: "gift-outline", locked },
        ]}
      />
    </FormField>
  );
}
