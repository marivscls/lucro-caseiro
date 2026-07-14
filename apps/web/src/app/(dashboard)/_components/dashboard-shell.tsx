"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabase } from "@/shared/lib/supabase";
import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) router.replace("/login");
        else setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);
  if (!ready)
    return (
      <main className="loading-screen">
        <div className="brand-mark pulse">LC</div>
        <p>Preparando sua central…</p>
      </main>
    );
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">{children}</main>
    </div>
  );
}
