import { Button, Typography, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Linking, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResponsiveModal } from "./responsive-modal-surface";

type BarcodeScanningResult = { data?: string | null };

type CameraModule = {
  CameraView: React.ComponentType<{
    style?: unknown;
    facing?: "front" | "back";
    barcodeScannerSettings?: { barcodeTypes: string[] };
    onBarcodeScanned?: (result: BarcodeScanningResult) => void;
  }>;
  useCameraPermissions: () => [
    { granted?: boolean; canAskAgain?: boolean } | null,
    () => Promise<unknown>,
  ];
};

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  /** Chamado uma vez com o conteúdo lido do código de barras/QR. */
  onScanned: (code: string) => void;
  /** Ação alternativa: digitar o código à mão (some quando ausente). */
  onManual?: () => void;
}

type BarcodeScannerRuntimeProps = Omit<BarcodeScannerProps, "visible">;

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
  if (!visible) return null;

  const camera = loadCameraModule();
  if (!camera) {
    return <BarcodeScannerUnavailable onClose={onClose} onManual={onManual} />;
  }

  return (
    <BarcodeScannerNative
      camera={camera}
      onClose={onClose}
      onScanned={onScanned}
      onManual={onManual}
    />
  );
}

function loadCameraModule(): CameraModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native load prevents route import crashes on stale dev builds.
    return require("expo-camera") as CameraModule;
  } catch {
    return null;
  }
}

function BarcodeScannerNative({
  camera,
  onClose,
  onScanned,
  onManual,
}: Readonly<BarcodeScannerRuntimeProps & { camera: CameraModule }>) {
  const insets = useSafeAreaInsets();
  const { CameraView, useCameraPermissions } = camera;
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);

  useEffect(() => {
    handledRef.current = false;
  }, []);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) {
      void requestPermission();
    }
  }, [permission?.granted, permission?.canAskAgain, requestPermission]);

  function handleScan(result: BarcodeScanningResult) {
    if (handledRef.current) return;
    const value = result.data?.trim();
    if (!value) return;
    handledRef.current = true;
    onScanned(value);
  }

  return (
    <ResponsiveModal
      visible
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      desktopMaxWidth={840}
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
    </ResponsiveModal>
  );
}

function BarcodeScannerUnavailable({
  onClose,
  onManual,
}: Readonly<Pick<BarcodeScannerRuntimeProps, "onClose" | "onManual">>) {
  const insets = useSafeAreaInsets();

  return (
    <ResponsiveModal
      visible
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      desktopMaxWidth={840}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
        <Typography variant="h3" color="#FFFFFF" style={{ textAlign: "center" }}>
          Câmera indisponível
        </Typography>
        <Typography
          variant="body"
          color="rgba(255,255,255,0.8)"
          style={{ textAlign: "center" }}
        >
          Esta build do app ainda não tem o módulo de câmera. Digite o código à mão ou
          gere uma nova build do app.
        </Typography>
        {onManual ? (
          <Button title="Digitar à mão" variant="secondary" onPress={onManual} />
        ) : null}
        <Button title="Fechar" onPress={onClose} />
        <View
          style={{
            position: "absolute",
            top: insets.top + spacing.md,
            right: spacing.lg,
          }}
        >
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
      </View>
    </ResponsiveModal>
  );
}
