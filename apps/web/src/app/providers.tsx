"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => watchForUpdate(registration, setUpdateAvailable))
        .catch(() => undefined);
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {updateAvailable && (
        <div className="update-banner">
          <span>Uma nova versão da central está pronta.</span>
          <button onClick={() => window.location.reload()}>Atualizar agora</button>
        </div>
      )}
    </QueryClientProvider>
  );
}

function watchForUpdate(
  registration: ServiceWorkerRegistration,
  setUpdateAvailable: (available: boolean) => void,
) {
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }
    });
  });
}
