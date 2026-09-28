import type { CreateSupplier, Supplier } from "@lucro-caseiro/contracts";
import { Button } from "@lucro-caseiro/ui";
import React from "react";

import { showAlert } from "../../../shared/components/alert-store";
import { FormActions } from "../../../shared/components/form-layout";
import { StandardModal } from "../../../shared/components/standard-modal";
import { showToast } from "../../../shared/components/toast";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import { alertError } from "../../../shared/utils/alerts";
import { digitsOnly, duplicateKey } from "../../../shared/utils/duplicates";
import { useCreateSupplier, useSuppliers } from "../hooks";
import { SupplierForm, type SupplierFormHandle } from "./supplier-form";

interface CreateSupplierFormProps {
  onSuccess?: (supplier?: Supplier) => void;
  modal: { visible: boolean; onClose: () => void };
}

export function CreateSupplierForm({
  onSuccess,
  modal,
}: Readonly<CreateSupplierFormProps>) {
  const formRef = React.useRef<SupplierFormHandle>(null);
  const [formSubmitting, setFormSubmitting] = React.useState(false);
  const createSupplier = useCreateSupplier();
  const { checkAndBlock: checkSupplierLimit } = useLimitCheck("suppliers");
  const showPaywall = usePaywall((state) => state.show);
  const { data: existing } = useSuppliers();

  async function submit(data: CreateSupplier) {
    if (checkSupplierLimit()) return;
    const duplicate = existing?.items.find(
      (supplier) =>
        duplicateKey(supplier.name) === duplicateKey(data.name) ||
        (!!data.phone && digitsOnly(supplier.phone) === data.phone) ||
        (!!data.email && duplicateKey(supplier.email) === duplicateKey(data.email)),
    );
    if (duplicate) {
      showAlert({
        title: "Fornecedor já cadastrado",
        message: "Esse nome ou contato já pertence a um fornecedor cadastrado.",
      });
      return;
    }

    try {
      const created = await createSupplier.mutateAsync(data);
      onSuccess?.(created);
      showToast(`${created.name} foi adicionado à sua lista.`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "LIMIT_EXCEEDED") {
        showPaywall("suppliers");
        return;
      }
      alertError(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o fornecedor.",
      );
    }
  }

  const isSubmitting = createSupplier.isPending || formSubmitting;

  return (
    <StandardModal
      visible={modal.visible}
      onClose={modal.onClose}
      title="Novo fornecedor"
      size="form"
      closeAccessibilityLabel="Fechar formulário"
      dismissDisabled={isSubmitting}
      footer={
        <FormActions>
          <Button
            title="Cancelar"
            variant="outline"
            disabled={isSubmitting}
            onPress={modal.onClose}
          />
          <Button
            title="Cadastrar fornecedor"
            loading={isSubmitting}
            onPress={() => {
              void formRef.current?.submit();
            }}
          />
        </FormActions>
      }
    >
      <SupplierForm
        ref={formRef}
        onSubmit={submit}
        disabled={isSubmitting}
        onSubmittingChange={setFormSubmitting}
      />
    </StandardModal>
  );
}
