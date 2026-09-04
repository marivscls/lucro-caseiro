import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useAuth } from "../../shared/hooks/use-auth";
import { useOnboarding } from "../../shared/hooks/use-onboarding";
import { supabase } from "../../shared/utils/supabase";
import { useProfile, useUpdateProfile } from "../subscription/hooks";
import {
  profileAnswers,
  readBusinessOnboarding,
  saveBusinessOnboarding,
} from "./business-profile-data";
import type { BusinessProfileAnswers } from "./profile-data";

export function useBusinessOnboarding() {
  const userId = useAuth((state) => state.userId);
  const {
    data: account,
    isPending: profilePending,
    isError: profileError,
    refetch: refetchProfile,
  } = useProfile();
  const updateProfile = useUpdateProfile();
  const client = useQueryClient();
  const key = ["business-onboarding", userId];
  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (data.user.id !== userId)
        throw new Error("A conta mudou. Abra o perfil novamente.");
      if (useAuth.getState().userId === userId) useAuth.setState({ user: data.user });
      return readBusinessOnboarding(data.user.user_metadata.business_onboarding);
    },
    staleTime: 60_000,
  });
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(value: BusinessProfileAnswers | null) {
    if (lock.current || !userId) return false;
    lock.current = true;
    setSaving(true);
    setError(null);
    try {
      const record = await saveBusinessOnboarding(value, {
        updateProfile: (data) => updateProfile.mutateAsync(data),
        updateMetadata: async (metadata) => {
          if (useAuth.getState().userId !== userId) throw new Error("A conta mudou.");
          const { error: saveError } = await supabase.auth.updateUser({ data: metadata });
          if (saveError) throw saveError;
        },
      });
      client.setQueryData(key, record);
      if (useAuth.getState().userId !== userId) return false;
      useOnboarding.setState((state) => ({
        completed: true,
        completedUserIds: [...new Set([...state.completedUserIds, userId])],
        pendingUserIds: state.pendingUserIds.filter((id) => id !== userId),
      }));
      return true;
    } catch {
      setError(
        "Não foi possível salvar na sua conta. Confira a conexão e tente novamente. Suas respostas continuam aqui.",
      );
      return false;
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  return {
    record: query.data ?? null,
    answers: profileAnswers(query.data ?? null, account),
    loading: query.isPending || profilePending,
    loadError: query.isError || profileError,
    retry: () => {
      void query.refetch();
      void refetchProfile();
    },
    saving,
    error,
    save,
  };
}
