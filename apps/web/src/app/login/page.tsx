"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSupabase } from "@/shared/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await getSupabase().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.replace("/");
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand-mark">LC</div>
        <p className="eyebrow">Lucro Caseiro</p>
        <h1>Marketing com direção, consistência e memória.</h1>
        <p>
          Da ideia ao calendário. Do documento à campanha. Dos resultados ao próximo
          teste.
        </p>
      </section>
      <section className="login-panel">
        <form className="auth-card" onSubmit={(event) => void login(event)}>
          <LockKeyhole size={28} />
          <div>
            <p className="eyebrow">Acesso privado</p>
            <h2>Entre na central</h2>
          </div>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
