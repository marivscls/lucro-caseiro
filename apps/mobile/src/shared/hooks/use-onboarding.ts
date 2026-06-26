import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const secureStoreStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

interface OnboardingState {
  completed: boolean;
  // Contas (userId) que já concluíram o onboarding NESTE aparelho. Diferente de
  // `completed` (sessão atual, zerado no signOut), esta lista NÃO é apagada ao
  // sair: garante que quem já concluiu nunca reveja o onboarding ao relogar,
  // mesmo que não tenha salvo o nome do negócio no servidor.
  completedUserIds: string[];
  currentStep: number;
  businessType: string | null;
  businessName: string | null;
  // Card "Comece por aqui" da home: some quando a pessoa pula ou conclui os passos.
  dismissedGettingStarted: boolean;
  setStep: (step: number) => void;
  setBusinessType: (type: string) => void;
  setBusinessName: (name: string) => void;
  completeOnboarding: (userId?: string | null) => void;
  dismissGettingStarted: () => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      completedUserIds: [],
      currentStep: 0,
      businessType: null,
      businessName: null,
      dismissedGettingStarted: false,
      setStep: (step) => set({ currentStep: step }),
      setBusinessType: (type) => set({ businessType: type }),
      setBusinessName: (name) => set({ businessName: name }),
      completeOnboarding: (userId) =>
        set((state) => ({
          completed: true,
          completedUserIds:
            userId && !state.completedUserIds.includes(userId)
              ? [...state.completedUserIds, userId]
              : state.completedUserIds,
        })),
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
      storage: createJSONStorage(() => secureStoreStorage),
    },
  ),
);
