import { Button, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { AppIcon } from "./app-icon";

interface AppErrorBoundaryProps {
  readonly children: React.ReactNode;
  /** Relato do erro (ex.: métricas); falhas aqui nunca derrubam a tela amigável. */
  readonly onError?: (error: unknown) => void;
  readonly renderFallback?: (reset: () => void) => React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export function CrashScreen({ onRetry }: Readonly<{ onRetry: () => void }>) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        padding: spacing["3xl"],
        backgroundColor: theme.colors.background,
      }}
    >
      <AppIcon name="alert-circle-outline" size={52} color={theme.colors.textSecondary} />
      <Typography variant="h2" style={{ textAlign: "center" }}>
        Algo deu errado
      </Typography>
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", maxWidth: 320 }}
      >
        Seus dados estão guardados. Toque no botão abaixo para voltar a usar o app.
      </Typography>
      <Button title="Tentar de novo" onPress={onRetry} />
    </View>
  );
}

/** Barreira raiz: troca uma tela quebrada por uma mensagem amigável com nova tentativa. */
export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    try {
      this.props.onError?.(error);
    } catch {
      // Relatar o erro é best effort.
    }
  }

  reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.JSX.Element {
    if (!this.state.hasError) return <>{this.props.children}</>;
    return (
      <>
        {this.props.renderFallback?.(this.reset) ?? <CrashScreen onRetry={this.reset} />}
      </>
    );
  }
}
