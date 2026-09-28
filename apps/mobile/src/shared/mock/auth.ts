import { emptyDemoData, seededDemoData } from "./fixtures";
import { saveDemoData } from "./db";
import { mockUuid, readMockJson, writeMockJson } from "./storage";

// Auth local do modo demonstração. Implementa só a parte do cliente Supabase que o
// app usa (auth + storage), com qualquer e-mail/senha aceitos após um atraso curto.

const AUTH_DELAY_MS = 600;
const REGISTRY_KEY = "users";
const SESSION_KEY = "session";
const GOOGLE_DEMO_EMAIL = "google.demo@lucrocaseiro.app";

type Metadata = Record<string, unknown>;

export interface DemoUserRecord {
  id: string;
  email: string;
  createdAt: string;
  metadata: Metadata;
}

interface DemoUser {
  id: string;
  aud: "authenticated";
  role: "authenticated";
  email: string;
  created_at: string;
  updated_at: string;
  app_metadata: { provider: string };
  user_metadata: Metadata;
  identities: { id: string; provider: string }[];
}

interface DemoSession {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  user: DemoUser;
}

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED" | "TOKEN_REFRESHED";
type Listener = (event: AuthEvent, session: DemoSession | null) => void;

const listeners = new Set<Listener>();
const uploadedUrls = new Map<string, string>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function registry(): Record<string, DemoUserRecord> {
  return readMockJson<Record<string, DemoUserRecord>>(REGISTRY_KEY) ?? {};
}

function saveRecord(record: DemoUserRecord): void {
  writeMockJson(REGISTRY_KEY, { ...registry(), [record.email]: record });
}

/** Nome amigável a partir do e-mail ("ana.souza@x" → "Ana Souza"). */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local
    .split(/[._\-+\d]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return words.join(" ") || "Visitante";
}

export function tokenForUser(userId: string): string {
  return `demo-token.${userId}`;
}

export function userIdFromToken(token: string | null | undefined): string | null {
  if (!token?.startsWith("demo-token.")) return null;
  return token.slice("demo-token.".length) || null;
}

function toUser(record: DemoUserRecord, provider = "email"): DemoUser {
  return {
    id: record.id,
    aud: "authenticated",
    role: "authenticated",
    email: record.email,
    created_at: record.createdAt,
    updated_at: new Date().toISOString(),
    app_metadata: { provider },
    user_metadata: record.metadata,
    identities: [{ id: record.id, provider }],
  };
}

function toSession(record: DemoUserRecord, provider?: string): DemoSession {
  const expiresIn = 60 * 60 * 24 * 365;
  return {
    access_token: tokenForUser(record.id),
    refresh_token: `demo-refresh.${record.id}`,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: toUser(record, provider),
  };
}

function currentSession(): DemoSession | null {
  return readMockJson<DemoSession>(SESSION_KEY);
}

/** Conta da sessão atual, para a API simulada criar dados que faltem. */
export function currentDemoAccount(): {
  id: string;
  email: string;
  name: string;
  createdAt: string;
} | null {
  const session = currentSession();
  if (!session) return null;
  const name = session.user.user_metadata.name;
  return {
    id: session.user.id,
    email: session.user.email,
    name: typeof name === "string" ? name : nameFromEmail(session.user.email),
    createdAt: session.user.created_at,
  };
}

function emit(event: AuthEvent, session: DemoSession | null): void {
  // Como o Supabase: avisa fora da pilha atual.
  setTimeout(() => {
    for (const listener of listeners) listener(event, session);
  }, 0);
}

function startSession(record: DemoUserRecord, provider?: string): DemoSession {
  const session = toSession(record, provider);
  writeMockJson(SESSION_KEY, session);
  emit("SIGNED_IN", session);
  return session;
}

function createAccount(email: string, metadata: Metadata): DemoUserRecord {
  const record: DemoUserRecord = {
    id: mockUuid(),
    email,
    createdAt: new Date().toISOString(),
    metadata,
  };
  saveRecord(record);
  const name = typeof metadata.name === "string" ? metadata.name : nameFromEmail(email);
  saveDemoData(record.id, emptyDemoData({ ...record, name }));
  return record;
}

/** Conta "antiga" com a confeitaria de exemplo, para quem entra sem se cadastrar. */
function createSeededAccount(email: string): DemoUserRecord {
  const now = Date.now();
  const name = nameFromEmail(email);
  const record: DemoUserRecord = {
    id: mockUuid(),
    email,
    createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      name,
      business_name: "Doces da Ana",
      onboarding_completed: true,
      business_onboarding: {
        version: 1,
        status: "completed",
        answers: {
          segment: "sweets",
          stage: "selling",
          goal: "orders",
          channels: ["whatsapp", "instagram"],
        },
      },
    },
  };
  saveRecord(record);
  saveDemoData(record.id, seededDemoData({ ...record, name }, now));
  return record;
}

const noError = null;

export const mockSupabase = {
  auth: {
    getSession() {
      return Promise.resolve({ data: { session: currentSession() }, error: noError });
    },
    getUser() {
      const session = currentSession();
      if (!session) {
        return Promise.resolve({
          data: { user: null },
          error: { name: "AuthSessionMissingError", message: "Auth session missing!" },
        });
      }
      return Promise.resolve({ data: { user: session.user }, error: noError });
    },
    onAuthStateChange(listener: Listener) {
      listeners.add(listener);
      return {
        data: { subscription: { unsubscribe: () => listeners.delete(listener) } },
      };
    },
    async signInWithPassword({ email }: { email: string; password: string }) {
      await wait(AUTH_DELAY_MS);
      const key = email.trim().toLowerCase();
      const record = registry()[key] ?? createSeededAccount(key);
      const session = startSession(record);
      return { data: { user: session.user, session }, error: noError };
    },
    async signUp({
      email,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: Metadata };
    }) {
      await wait(AUTH_DELAY_MS);
      const record = createAccount(email.trim().toLowerCase(), options?.data ?? {});
      const session = startSession(record);
      return { data: { user: session.user, session }, error: noError };
    },
    async signInWithOAuth({ provider }: { provider: string }) {
      await wait(AUTH_DELAY_MS);
      const record =
        registry()[GOOGLE_DEMO_EMAIL] ??
        createAccount(GOOGLE_DEMO_EMAIL, { name: "Visitante Google" });
      startSession(record, provider);
      // No web o app só espera o redirecionamento; a sessão já está ativa.
      return { data: { provider, url: "about:blank" }, error: noError };
    },
    signOut(_options?: { scope?: string }) {
      writeMockJson(SESSION_KEY, null);
      emit("SIGNED_OUT", null);
      return Promise.resolve({ error: noError });
    },
    async updateUser({ data }: { data?: Metadata; password?: string }) {
      await wait(200);
      const session = currentSession();
      if (!session) {
        return {
          data: { user: null },
          error: { name: "AuthSessionMissingError", message: "Auth session missing!" },
        };
      }
      const record = registry()[session.user.email];
      const next: DemoUserRecord = {
        id: session.user.id,
        email: session.user.email,
        createdAt: session.user.created_at,
        metadata: { ...(record?.metadata ?? session.user.user_metadata), ...data },
      };
      saveRecord(next);
      const updated = { ...session, user: toUser(next) };
      writeMockJson(SESSION_KEY, updated);
      emit("USER_UPDATED", updated);
      return { data: { user: updated.user }, error: noError };
    },
    refreshSession() {
      const session = currentSession();
      return Promise.resolve({
        data: { session, user: session?.user ?? null },
        error: session ? noError : { name: "AuthSessionMissingError", message: "" },
      });
    },
    exchangeCodeForSession(_code: string) {
      return Promise.resolve({ data: { session: currentSession() }, error: noError });
    },
    setSession(_tokens: { access_token: string; refresh_token: string }) {
      return Promise.resolve({ data: { session: currentSession() }, error: noError });
    },
    async resetPasswordForEmail(_email: string, _options?: unknown) {
      await wait(AUTH_DELAY_MS);
      return { data: {}, error: noError };
    },
  },
  storage: {
    from(_bucket: string) {
      return {
        upload(path: string, body: ArrayBuffer, options?: { contentType?: string }) {
          let url = "";
          try {
            url = URL.createObjectURL(
              new Blob([body], { type: options?.contentType ?? "image/jpeg" }),
            );
          } catch {
            // Sem Blob URL (nativo): a imagem simplesmente não é exibida.
          }
          uploadedUrls.set(path, url);
          return Promise.resolve({ data: { path }, error: noError });
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: uploadedUrls.get(path) ?? "" } };
        },
      };
    },
  },
};
