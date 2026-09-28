import { useEffect, useState } from "react";
import { apiClient } from "../utils/api-client";
import { useAuth } from "./use-auth";

interface PreferenceResponse {
  actionEmails: boolean;
}

export function useActionEmailPreference(active: boolean) {
  const token = useAuth((state) => state.token);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(false);
    setStatus("loading");
    if (!active || !token) return;
    let current = true;
    apiClient<PreferenceResponse>("/api/v1/email-preferences", { token })
      .then((preference) => {
        if (current) {
          setEnabled(preference.actionEmails);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (current) setStatus("error");
      });
    return () => {
      current = false;
    };
  }, [active, token]);

  async function update(value: boolean): Promise<void> {
    if (!token || status !== "ready" || saving) return;
    setSaving(true);
    try {
      const preference = await apiClient<PreferenceResponse>(
        "/api/v1/email-preferences",
        {
          method: "PUT",
          token,
          body: { actionEmails: value },
        },
      );
      setEnabled(preference.actionEmails);
    } finally {
      setSaving(false);
    }
  }

  return { enabled, status, saving, update };
}
