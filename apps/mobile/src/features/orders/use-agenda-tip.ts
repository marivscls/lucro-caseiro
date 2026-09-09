import { useEffect, useState } from "react";
import { asyncStorage } from "../../shared/utils/async-storage";

export function useAgendaTip(userId: string | null) {
  const key = userId ? `agenda-tip:v1:${userId}` : null;
  const [loaded, setLoaded] = useState<{ key: string; visible: boolean } | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    void asyncStorage.getItem(key).then((saved) => {
      if (active) setLoaded({ key, visible: saved !== "dismissed" });
    });
    return () => {
      active = false;
    };
  }, [key]);

  return {
    visible: !!key && loaded?.key === key && loaded.visible,
    dismiss: () => {
      if (!key) return;
      setLoaded({ key, visible: false });
      void asyncStorage.setItem(key, "dismissed");
    },
  };
}
