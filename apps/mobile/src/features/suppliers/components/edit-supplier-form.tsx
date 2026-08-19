import type { CreateSupplier, Supplier } from "@lucro-caseiro/contracts";
import { Button } from "@lucro-caseiro/ui";
import React from "react";

import { StandardModal } from "../../../shared/components/standard-modal";
import { showToast } from "../../../shared/components/toast";
import { alertError } from "../../../shared/utils/alerts";
import { useUpdateSupplier } from "../hooks";
import { SupplierForm, type SupplierFormHandle } from "./supplier-form";

interface EditSupplierFormProps {
  supplier: Supplier;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditSupplierForm({
  supplier,
  visible,
  onClose,
  onSuccess,
}: Readonly<EditSupplierFormProps>) {
  const formRef = React.useRef<SupplierFormHandle>(null);
  const [formSubmitting, setFormSubmitting] = React.useState(false);
  const updateSupplier = useUpdateSupplier();
  const isSubmitting = updateSupplier.isPending || formSubmitting;

  async function submit(data: CreateSupplier) {
    try {
      await updateSupplier.mutateAsync({ id: supplier.id, data });
      onSuccess?.();
      showToast(`${data.name} atualizado!`);
    } catch (error) {
      alertError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o fornecedor.",
      );
    }
  }

  return (
    <StandardModal
      title="Editar fornecedor"
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel="Fechar formulário"
      dismissDisabled={isSubmitting}
      footer={
        <Button
          title="Salvar alterações"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={() => {
            void formRef.current?.submit();
          }}
          style={{ flex: 1 }}
        />
      }
    >
      <SupplierForm
        ref={formRef}
        supplier={supplier}
        onSubmit={submit}
        disabled={isSubmitting}
        onSubmittingChange={setFormSubmitting}
      />
    </StandardModal>
  );
}
