import { useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Modal, View, type ModalProps } from "react-native";

import {
  desktopModalSurface,
  responsiveModalPresentation,
} from "../layout/desktop-density";
import { useDesktopLayout } from "../layout/use-desktop-layout";

interface ResponsiveModalSurfaceProps {
  readonly children: React.ReactNode;
  readonly maxWidth?: number;
}

/**
 * Mantém o modal como tela cheia no mobile e o transforma em uma superfície
 * centralizada no desktop. A contenção fica na raiz real do modal, não no
 * contentContainerStyle interno de um ScrollView.
 */
export function ResponsiveModalSurface({
  children,
  maxWidth = 1040,
}: ResponsiveModalSurfaceProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();

  return (
    <View
      style={{
        flex: 1,
        padding: isDesktop ? 24 : 0,
        backgroundColor: isDesktop ? "rgba(45, 31, 25, 0.28)" : theme.colors.background,
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
  ...props
}: Readonly<ResponsiveModalProps>) {
  return (
    <ResponsiveOverlayModal {...props}>
      <ResponsiveModalSurface maxWidth={desktopMaxWidth}>
        {children}
      </ResponsiveModalSurface>
    </ResponsiveOverlayModal>
  );
}
