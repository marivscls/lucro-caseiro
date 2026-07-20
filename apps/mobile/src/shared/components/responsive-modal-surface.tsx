import { useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Modal, View, type ModalProps, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  desktopModalSurface,
  responsiveModalPresentation,
} from "../layout/desktop-density";
import { useDesktopLayout } from "../layout/use-desktop-layout";

interface ResponsiveModalSurfaceProps {
  readonly children: React.ReactNode;
  readonly maxWidth?: number;
  readonly size?: "full" | "hug";
}

export function hugModalSafeAreaStyle(
  isDesktop: boolean,
  bottomInset: number,
): Pick<ViewStyle, "padding" | "paddingBottom"> {
  return {
    padding: isDesktop ? 24 : 0,
    paddingBottom: isDesktop ? 24 : bottomInset,
  };
}

/**
 * Mantém o modal como tela cheia no mobile e o transforma em uma superfície
 * centralizada no desktop. A contenção fica na raiz real do modal, não no
 * contentContainerStyle interno de um ScrollView.
 *
 * size="hug": a superfície abraça o conteúdo — bottom sheet no mobile,
 * dialog centralizado no desktop — encolhendo quando o conteúdo é curto.
 */
export function ResponsiveModalSurface({
  children,
  maxWidth = 1040,
  size = "full",
}: ResponsiveModalSurfaceProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();

  if (size === "hug") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: isDesktop ? "center" : "flex-end",
          ...hugModalSafeAreaStyle(isDesktop, insets.bottom),
          backgroundColor: theme.colors.overlay,
        }}
      >
        <View
          style={[
            {
              flexGrow: 0,
              flexShrink: 1,
              overflow: "hidden",
              backgroundColor: theme.colors.surfaceElevated,
            },
            isDesktop
              ? {
                  alignSelf: "center",
                  width: "100%",
                  maxWidth,
                  maxHeight: "85%",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }
              : {
                  maxHeight: "92%",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                },
            theme.shadows.lg,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: isDesktop ? 24 : 0,
        backgroundColor: isDesktop ? theme.colors.overlay : theme.colors.background,
      }}
    >
      <View
        style={[
          { flex: 1, backgroundColor: theme.colors.background },
          desktopModalSurface(isDesktop, maxWidth),
          isDesktop
            ? {
                borderWidth: 1,
                borderColor: theme.colors.border,
              }
            : undefined,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

interface ResponsiveModalProps extends ModalProps {
  readonly desktopMaxWidth?: number;
  readonly size?: "full" | "hug";
}

/**
 * Mantém o conteúdo customizado do modal intacto, mas usa a apresentação web
 * correta: sobre a shell, com o fundo ainda visível e sem animação de bottom sheet.
 */
export function ResponsiveOverlayModal({
  children,
  animationType,
  presentationStyle,
  transparent,
  ...props
}: Readonly<ModalProps>) {
  const isDesktop = useDesktopLayout();
  const responsivePresentation = responsiveModalPresentation(isDesktop, {
    animationType,
    presentationStyle,
    transparent,
  });

  return (
    <Modal {...props} {...responsivePresentation}>
      {children}
    </Modal>
  );
}

export function ResponsiveModal({
  children,
  desktopMaxWidth = 1040,
  size = "full",
  ...props
}: Readonly<ResponsiveModalProps>) {
  return (
    <ResponsiveOverlayModal {...props}>
      <ResponsiveModalSurface maxWidth={desktopMaxWidth} size={size}>
        {children}
      </ResponsiveModalSurface>
    </ResponsiveOverlayModal>
  );
}
