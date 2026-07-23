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
  // Card "Comece por aqui" da home: some quando a pessoa pula ou conclui os passos.
  dismissedGettingStarted: boolean;
  setStep: (step: number) => void;
  setBusinessType: (type: string) => void;
  setBusinessName: (name: string) => void;
  startOnboarding: (userId: string) => void;
  completeOnboarding: (userId?: string | null) => Promise<void>;
  dismissGettingStarted: () => void;
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
      dismissedGettingStarted: false,
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
      dismissGettingStarted: () => set({ dismissedGettingStarted: true }),
      // Zera só o estado de sessão; `completedUserIds` é preservado de
      // propósito (memória por conta neste aparelho).
      reset: () =>
        set({
          completed: false,
          currentStep: 0,
          businessType: null,
          businessName: null,
          dismissedGettingStarted: false,
        }),
    }),
    {
      name: "onboarding-state",
      storage: createJSONStorage(() => asyncStorage),
    },
  ),
);
