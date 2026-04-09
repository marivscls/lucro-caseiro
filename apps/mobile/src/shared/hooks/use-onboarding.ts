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
  currentStep: number;
  businessType: string | null;
  businessName: string | null;
  setStep: (step: number) => void;
  setBusinessType: (type: string) => void;
  setBusinessName: (name: string) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: 0,
      businessType: null,
      businessName: null,
      setStep: (step) => set({ currentStep: step }),
      setBusinessType: (type) => set({ businessType: type }),
      setBusinessName: (name) => set({ businessName: name }),
      completeOnboarding: () => set({ completed: true }),
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
      storage: createJSONStorage(() => secureStoreStorage),
    },
  ),
);
