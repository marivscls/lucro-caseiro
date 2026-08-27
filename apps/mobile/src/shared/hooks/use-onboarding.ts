import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { asyncStorage } from "../utils/async-storage";
import { supabase } from "../utils/supabase";

interface OnboardingState {
  completed: boolean;
  // Contas (userId) que já concluíram o onboarding NESTE aparelho. Diferente de
  // `completed` (sessão atual, zerado no signOut), esta lista NÃO é apagada ao
  // sair: garante que quem já concluiu nunca reveja o onboarding ao relogar,
  // mesmo que não tenha salvo o nome do negócio no servidor.
  completedUserIds: string[];
  // Contas criadas neste aparelho que ainda precisam passar pelo onboarding.
  // Persiste mesmo quando o cadastro exige confirmar o e-mail e entrar depois.
  pendingUserIds: string[];
  currentStep: number;
  businessType: string | null;
  businessName: string | null;
  // Guia de ativacao da home. O progresso real vem dos dados de produto e venda;
  // estas listas guardam apenas quem iniciou, quem fechou com "Agora não" e quem
  // confirmou o resultado. Persistidas por conta neste aparelho.
  gettingStartedStartedUserIds: string[];
  gettingStartedDismissedUserIds: string[];
  gettingStartedCompletedUserIds: string[];
  setStep: (step: number) => void;
  setBusinessType: (type: string) => void;
  setBusinessName: (name: string) => void;
  startOnboarding: (userId: string) => void;
  completeOnboarding: (userId?: string | null) => Promise<void>;
  startGettingStarted: (userId: string) => void;
  dismissGettingStarted: (userId: string) => void;
  reopenGettingStarted: (userId: string) => void;
  completeGettingStarted: (userId: string) => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      completedUserIds: [],
      pendingUserIds: [],
      currentStep: 0,
      businessType: null,
      businessName: null,
      gettingStartedStartedUserIds: [],
      gettingStartedDismissedUserIds: [],
      gettingStartedCompletedUserIds: [],
      setStep: (step) => set({ currentStep: step }),
      setBusinessType: (type) => set({ businessType: type }),
      setBusinessName: (name) => set({ businessName: name }),
      startOnboarding: (userId) =>
        set((state) => ({
          pendingUserIds: state.pendingUserIds.includes(userId)
            ? state.pendingUserIds
            : [...state.pendingUserIds, userId],
        })),
      completeOnboarding: async (userId) => {
        const { error } = await supabase.auth.updateUser({
          data: { onboarding_completed: true },
        });
        if (error) throw error;

        set((state) => ({
          completed: true,
          completedUserIds:
            userId && !state.completedUserIds.includes(userId)
              ? [...state.completedUserIds, userId]
              : state.completedUserIds,
          pendingUserIds: userId
            ? state.pendingUserIds.filter((id) => id !== userId)
            : state.pendingUserIds,
        }));
      },
      startGettingStarted: (userId) =>
        set((state) => ({
          gettingStartedStartedUserIds: state.gettingStartedStartedUserIds.includes(
            userId,
          )
            ? state.gettingStartedStartedUserIds
            : [...state.gettingStartedStartedUserIds, userId],
        })),
      dismissGettingStarted: (userId) =>
        set((state) => ({
          gettingStartedDismissedUserIds: state.gettingStartedDismissedUserIds.includes(
            userId,
          )
            ? state.gettingStartedDismissedUserIds
            : [...state.gettingStartedDismissedUserIds, userId],
        })),
      reopenGettingStarted: (userId) =>
        set((state) => ({
          gettingStartedDismissedUserIds: state.gettingStartedDismissedUserIds.filter(
            (id) => id !== userId,
          ),
        })),
      completeGettingStarted: (userId) =>
        set((state) => ({
          gettingStartedCompletedUserIds: state.gettingStartedCompletedUserIds.includes(
            userId,
          )
            ? state.gettingStartedCompletedUserIds
            : [...state.gettingStartedCompletedUserIds, userId],
        })),
      // Zera só o estado de sessão; listas por userId (onboarding e guia) são
      // preservadas de propósito (memória por conta neste aparelho).
      reset: () =>
        set({
          completed: false,
          currentStep: 0,
          businessType: null,
          businessName: null,
        }),
    }),
    {
      name: "onboarding-state",
      storage: createJSONStorage(() => asyncStorage),
    },
  ),
);
