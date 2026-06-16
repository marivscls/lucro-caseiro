import { Button, Typography, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import React, { useEffect, useRef } from "react";
import { Linking, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  /** Chamado uma vez com o conteúdo lido do código de barras/QR. */
  onScanned: (code: string) => void;
  /** Ação alternativa: digitar o código à mão (some quando ausente). */
  onManual?: () => void;
}

/**
 * Leitor de código de barras/QR via câmera (expo-camera). Requer um dev/prod
 * build com o módulo nativo — não funciona em build sem ele. Pede permissão ao
 * abrir e dispara `onScanned` apenas uma vez por abertura.
 */
export function BarcodeScanner({
  visible,
  onClose,
  onScanned,
  onManual,
}: Readonly<BarcodeScannerProps>) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);

  useEffect(() => {
    if (visible) handledRef.current = false;
  }, [visible]);

  useEffect(() => {
    if (visible && !permission?.granted && permission?.canAskAgain !== false) {
      void requestPermission();
    }
  }, [visible, permission?.granted, permission?.canAskAgain, requestPermission]);

  function handleScan(result: BarcodeScanningResult) {
    if (handledRef.current) return;
    const value = result.data?.trim();
    if (!value) return;
    handledRef.current = true;
    onScanned(value);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "code39",
                "qr",
              ],
            }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.xl,
              gap: spacing.lg,
            }}
          >
            <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
            <Typography variant="h3" color="#FFFFFF" style={{ textAlign: "center" }}>
              Precisamos da câmera
            </Typography>
            <Typography
              variant="body"
              color="rgba(255,255,255,0.8)"
              style={{ textAlign: "center" }}
            >
              Para escanear o código do produto, permita o acesso à câmera.
            </Typography>
            {permission && !permission.canAskAgain ? (
              <Button
                title="Abrir configurações"
                onPress={() => void Linking.openSettings()}
              />
            ) : (
              <Button title="Permitir câmera" onPress={() => void requestPermission()} />
            )}
            {onManual ? (
              <Button title="Digitar à mão" variant="secondary" onPress={onManual} />
            ) : null}
          </View>
        )}

        <View
          style={{
            position: "absolute",
            top: insets.top + spacing.md,
            left: spacing.lg,
            right: spacing.lg,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="bodyBold" color="#FFFFFF">
            Aponte para o código
          </Typography>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar scanner"
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {permission?.granted && onManual ? (
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + spacing.xl,
              left: spacing.xl,
              right: spacing.xl,
            }}
          >
            <Button title="Digitar à mão" variant="secondary" onPress={onManual} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
