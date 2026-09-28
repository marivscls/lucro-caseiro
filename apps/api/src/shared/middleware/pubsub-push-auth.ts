import { OAuth2Client } from "google-auth-library";

import { ServiceUnavailableError } from "../errors";

/**
 * Autenticacao de Pub/Sub push com OIDC: o Pub/Sub assina um ID token do Google
 * (`Authorization: Bearer <jwt>`) em nome da service account configurada na
 * push subscription. Verificamos assinatura, audience, emissor, validade,
 * `email` e `email_verified`.
 */
export interface PubSubPushAuthConfig {
  /** Audience configurada na push subscription (por padrao, a URL do endpoint). */
  audience: string;
  /** Service account usada pela push subscription para assinar o token. */
  serviceAccountEmail: string;
}

export interface PushIdTokenClaims {
  email?: string;
  email_verified?: boolean;
}

/** Token recusado (assinatura, audience, emissor ou validade). */
export class PushTokenRejectedError extends Error {
  constructor() {
    super("Token OIDC do Pub/Sub invalido");
    this.name = "PushTokenRejectedError";
  }
}

export interface IPushIdTokenVerifier {
  /**
   * Retorna os claims de um token valido para a audience.
   * Lanca `PushTokenRejectedError` para token invalido e
   * `ServiceUnavailableError` quando nao foi possivel buscar os certificados.
   */
  verify(idToken: string, audience: string): Promise<PushIdTokenClaims>;
}

export class GoogleOidcPushTokenVerifier implements IPushIdTokenVerifier {
  constructor(private client: OAuth2Client = new OAuth2Client()) {}

  async verify(idToken: string, audience: string): Promise<PushIdTokenClaims> {
    // Busca (e cacheia) os certificados antes: falha aqui e transitoria (503),
    // falha depois e do token (401).
    try {
      await this.client.getFederatedSignonCertsAsync();
    } catch {
      throw new ServiceUnavailableError(
        "Nao foi possivel buscar os certificados do Google",
      );
    }

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (!payload) throw new PushTokenRejectedError();
      return { email: payload.email, email_verified: payload.email_verified };
    } catch {
      throw new PushTokenRejectedError();
    }
  }
}

export function isPubSubPushAuthConfigured(config: PubSubPushAuthConfig): boolean {
  return config.audience.trim() !== "" && config.serviceAccountEmail.trim() !== "";
}

export function isTrustedPushIdentity(
  claims: PushIdTokenClaims,
  expectedEmail: string,
): boolean {
  return (
    claims.email_verified === true &&
    typeof claims.email === "string" &&
    claims.email.toLowerCase() === expectedEmail.trim().toLowerCase()
  );
}

function bearerToken(authorization: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization?.trim() ?? "");
  return match?.[1] ?? null;
}

/** true se o request vem da push subscription configurada. */
export async function isAuthenticPubSubPush(
  authorization: string | undefined,
  config: PubSubPushAuthConfig,
  verifier: IPushIdTokenVerifier,
): Promise<boolean> {
  const token = bearerToken(authorization);
  if (!token) return false;
  try {
    const claims = await verifier.verify(token, config.audience.trim());
    return isTrustedPushIdentity(claims, config.serviceAccountEmail);
  } catch (error) {
    if (error instanceof PushTokenRejectedError) return false;
    throw error;
  }
}
