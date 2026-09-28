import { ASSISTANT_MAX_UPLOAD_BYTES } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Platform, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { FormField, OptionChip, TextField } from "../../../shared/components/form-field";
import { FormActions } from "../../../shared/components/form-layout";
import { showToast } from "../../../shared/components/toast";
import { alertError, errorMessage } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { type EditableRow, rowsToImport, toEditableRows } from "../domain";
import { useImportNotebook, useReadNotebook } from "../hooks";

type Source = "camera" | "library";

function replaceAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

async function pickImage(source: Source) {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    showAlert({
      title: "Permissão necessária",
      message:
        source === "camera"
          ? "Libere a câmera para fotografar o caderno."
          : "Libere a galeria para escolher a foto do caderno.",
    });
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.6,
    base64: true,
    exif: false,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const data = asset.base64 ?? (asset.uri.startsWith("data:") ? asset.uri : null);
  if (!data) {
    alertError("Não consegui ler essa foto. Tente outra.");
    return null;
  }
  if ((data.length * 3) / 4 > ASSISTANT_MAX_UPLOAD_BYTES) {
    alertError("A foto ficou grande demais. Tire outra um pouco mais de longe.");
    return null;
  }
  return { data, mimeType: asset.mimeType ?? "image/jpeg" };
}

function RowEditor({
  row,
  onChange,
}: Readonly<{ row: EditableRow; onChange: (row: EditableRow) => void }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        opacity: row.include ? 1 : 0.55,
      }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        <FormField label="Nome" style={{ flex: 2, minWidth: 160 }}>
          <TextField
            accessibilityLabel="Nome de quem deve"
            value={row.name}
            onChangeText={(name) => onChange({ ...row, name })}
          />
        </FormField>
        <FormField label="Valor" style={{ flex: 1, minWidth: 120 }}>
          <TextField
            prefix="R$"
            accessibilityLabel={`Valor que ${row.name} deve`}
            value={row.amount}
            keyboardType="numeric"
            onChangeText={(amount) =>
              onChange({ ...row, amount: maskCurrencyInput(amount) })
            }
          />
        </FormField>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ flex: 1 }}
        >
          {[
            row.date?.split("-").reverse().join("/"),
            row.note,
            row.clientId ? "cliente já cadastrado" : "cliente novo",
          ]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
        <OptionChip
          label={row.include ? "Importar" : "Pular"}
          selected={row.include}
          accessibilityRole="checkbox"
          accessibilityLabel={`Importar ${row.name}`}
          onPress={() => onChange({ ...row, include: !row.include })}
        />
      </View>
    </View>
  );
}

/** Foto do caderno de fiado vira clientes e fiados em aberto. */
export function NotebookImportCard({ disabled }: Readonly<{ disabled: boolean }>) {
  const { theme } = useTheme();
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const readNotebook = useReadNotebook();
  const importNotebook = useImportNotebook();

  async function handlePick(source: Source) {
    try {
      const image = await pickImage(source);
      if (!image) return;
      const result = await readNotebook.mutateAsync({ image });
      if (result.rows.length === 0) {
        alertError(
          "Não achei nomes e valores nessa foto. Tente com mais luz e o caderno reto.",
        );
        return;
      }
      setRows(toEditableRows(result.rows, currencyInput));
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  async function handleImport() {
    const data = rowsToImport(rows ?? [], parseCurrencyInput);
    if (data.length === 0) {
      alertError("Marque ao menos uma linha com nome e valor.");
      return;
    }
    try {
      const result = await importNotebook.mutateAsync({ rows: data });
      showToast(
        `${result.createdFiados} fiados importados (${formatCurrency(result.total)}).`,
      );
      setRows(null);
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  function updateRow(index: number, next: EditableRow) {
    setRows((current) => replaceAt(current ?? [], index, next));
  }

  const selected = rowsToImport(rows ?? [], parseCurrencyInput);
  const total = selected.reduce((sum, row) => sum + row.amount, 0);

  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h3">Passar o caderno de fiado para o app</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Tire uma foto da página. O app lê os nomes e os valores, você confere e importa
          tudo de uma vez.
        </Typography>
      </View>
      {rows ? (
        <>
          <View>
            {rows.map((row, index) => (
              <RowEditor
                key={row.key}
                row={row}
                onChange={(next) => updateRow(index, next)}
              />
            ))}
          </View>
          <Typography variant="bodyBold">
            {selected.length} fiados · {formatCurrency(total)}
          </Typography>
          <FormActions>
            <Button title="Descartar" variant="outline" onPress={() => setRows(null)} />
            <Button
              title={`Importar ${selected.length} fiados`}
              loading={importNotebook.isPending}
              disabled={selected.length === 0}
              onPress={() => void handleImport()}
            />
          </FormActions>
        </>
      ) : (
        <FormActions>
          {Platform.OS === "web" ? null : (
            <Button
              title="Tirar foto"
              variant="outline"
              disabled={disabled}
              icon={<AppIcon name="camera-outline" size={20} color={theme.colors.text} />}
              onPress={() => void handlePick("camera")}
            />
          )}
          <Button
            title="Escolher foto"
            disabled={disabled}
            loading={readNotebook.isPending}
            icon={
              <AppIcon
                name="image-outline"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={() => void handlePick("library")}
          />
        </FormActions>
      )}
    </Card>
  );
}
