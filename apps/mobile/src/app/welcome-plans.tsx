import { Redirect, useRouter } from "expo-router";
import React from "react";

import { PlansView } from "../features/subscription/components/plans-view";
import { useAuth } from "../shared/hooks/use-auth";
import { useOnboarding } from "../shared/hooks/use-onboarding";

// Planos logo após o cadastro, uma vez por conta neste aparelho. Só conta como
// visto quando a pessoa escolhe seguir: o aviso "Conta criada" do cadastro
// recarrega a rota inicial por cima desta tela e não pode pular os planos.
export default function WelcomePlansScreen() {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const markPlansIntroSeen = useOnboarding((state) => state.markPlansIntroSeen);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  function handleContinue() {
    if (userId) markPlansIntroSeen(userId);
    router.replace("/onboarding");
  }

  return <PlansView welcome={{ onContinue: handleContinue }} />;
}
