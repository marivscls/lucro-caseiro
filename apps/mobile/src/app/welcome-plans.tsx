import { Redirect, useRouter } from "expo-router";
import React, { useEffect } from "react";

import { PlansView } from "../features/subscription/components/plans-view";
import { useAuth } from "../shared/hooks/use-auth";
import { useOnboarding } from "../shared/hooks/use-onboarding";

// Planos logo após o cadastro (uma vez por conta neste aparelho). Marca como
// visto ao abrir: quem sair por qualquer caminho não volta a ver a tela.
export default function WelcomePlansScreen() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const markPlansIntroSeen = useOnboarding((state) => state.markPlansIntroSeen);

  useEffect(() => {
    if (userId) markPlansIntroSeen(userId);
  }, [userId, markPlansIntroSeen]);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <PlansView welcome={{ onContinue: () => router.replace("/onboarding") }} />;
}
