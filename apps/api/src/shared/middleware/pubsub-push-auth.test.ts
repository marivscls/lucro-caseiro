import type { OAuth2Client } from "google-auth-library";
import { describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "../errors";
import {
  GoogleOidcPushTokenVerifier,
  isAuthenticPubSubPush,
  isPubSubPushAuthConfigured,
  isTrustedPushIdentity,
  PushTokenRejectedError,
  type IPushIdTokenVerifier,
  type PushIdTokenClaims,
} from "./pubsub-push-auth";

const CONFIG = {
  audience: "https://api.example.com/api/v1/webhooks/google-play",
  serviceAccountEmail: "rtdn-push@proj.iam.gserviceaccount.com",
};

function makeVerifier(
  result: PushIdTokenClaims | Error = {
    email: CONFIG.serviceAccountEmail,
    email_verified: true,
  },
) {
  const verify = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  const verifier: IPushIdTokenVerifier = { verify };
  return { verifier, verify };
}

describe("isPubSubPushAuthConfigured", () => {
  it("requires both audience and service account email", () => {
    // Act
    const results = [
      isPubSubPushAuthConfigured(CONFIG),
      isPubSubPushAuthConfigured({ ...CONFIG, audience: " " }),
      isPubSubPushAuthConfigured({ ...CONFIG, serviceAccountEmail: "" }),
    ];

    // Assert
    expect(results).toEqual([true, false, false]);
  });
});

describe("isTrustedPushIdentity", () => {
  it("accepts the configured verified service account", () => {
    // Act
    const trusted = isTrustedPushIdentity(
      { email: "RTDN-push@proj.iam.gserviceaccount.com", email_verified: true },
      CONFIG.serviceAccountEmail,
    );

    // Assert
    expect(trusted).toBe(true);
  });

  it.each([
    [
      "another account",
      { email: "x@evil.iam.gserviceaccount.com", email_verified: true },
    ],
    ["unverified email", { email: CONFIG.serviceAccountEmail, email_verified: false }],
    ["missing email", { email_verified: true }],
  ])("rejects %s", (_label, claims) => {
    // Act
    const trusted = isTrustedPushIdentity(claims, CONFIG.serviceAccountEmail);

    // Assert
    expect(trusted).toBe(false);
  });
});

describe("isAuthenticPubSubPush", () => {
  it("verifies the bearer token against the configured audience", async () => {
    // Arrange
    const { verifier, verify } = makeVerifier();

    // Act
    const ok = await isAuthenticPubSubPush("Bearer jwt-1", CONFIG, verifier);

    // Assert
    expect(ok).toBe(true);
    expect(verify).toHaveBeenCalledWith("jwt-1", CONFIG.audience);
  });

  it("rejects requests without a bearer token", async () => {
    // Arrange
    const { verifier, verify } = makeVerifier();

    // Act
    const results = await Promise.all([
      isAuthenticPubSubPush(undefined, CONFIG, verifier),
      isAuthenticPubSubPush("Basic abc", CONFIG, verifier),
    ]);

    // Assert
    expect(results).toEqual([false, false]);
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects an invalid token", async () => {
    // Arrange
    const { verifier } = makeVerifier(new PushTokenRejectedError());

    // Act
    const ok = await isAuthenticPubSubPush("Bearer jwt-1", CONFIG, verifier);

    // Assert
    expect(ok).toBe(false);
  });

  it("rejects a valid token from another service account", async () => {
    // Arrange
    const { verifier } = makeVerifier({
      email: "other@proj.iam.gserviceaccount.com",
      email_verified: true,
    });

    // Act
    const ok = await isAuthenticPubSubPush("Bearer jwt-1", CONFIG, verifier);

    // Assert
    expect(ok).toBe(false);
  });

  it("propagates transient verification failures", async () => {
    // Arrange
    const { verifier } = makeVerifier(new ServiceUnavailableError("certs"));

    // Act
    const act = isAuthenticPubSubPush("Bearer jwt-1", CONFIG, verifier);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});

describe("GoogleOidcPushTokenVerifier", () => {
  function makeClient(overrides: {
    certs?: () => Promise<unknown>;
    verifyIdToken?: () => Promise<unknown>;
  }) {
    const verifyIdToken = vi.fn(
      overrides.verifyIdToken ??
        (() =>
          Promise.resolve({
            getPayload: () => ({
              email: CONFIG.serviceAccountEmail,
              email_verified: true,
            }),
          })),
    );
    const client = {
      getFederatedSignonCertsAsync: vi.fn(
        overrides.certs ?? (() => Promise.resolve({ certs: {} })),
      ),
      verifyIdToken,
    } as unknown as OAuth2Client;
    return { client, verifyIdToken };
  }

  it("returns the email claims of a valid token", async () => {
    // Arrange
    const { client, verifyIdToken } = makeClient({});
    const sut = new GoogleOidcPushTokenVerifier(client);

    // Act
    const claims = await sut.verify("jwt-1", CONFIG.audience);

    // Assert
    expect(claims).toEqual({ email: CONFIG.serviceAccountEmail, email_verified: true });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: "jwt-1",
      audience: CONFIG.audience,
    });
  });

  it("rejects tokens the library refuses", async () => {
    // Arrange
    const { client } = makeClient({
      verifyIdToken: () => Promise.reject(new Error("Wrong recipient")),
    });
    const sut = new GoogleOidcPushTokenVerifier(client);

    // Act
    const act = sut.verify("jwt-1", CONFIG.audience);

    // Assert
    await expect(act).rejects.toBeInstanceOf(PushTokenRejectedError);
  });

  it("reports certificate fetch failures as transient", async () => {
    // Arrange
    const { client } = makeClient({
      certs: () => Promise.reject(new Error("ECONNRESET")),
    });
    const sut = new GoogleOidcPushTokenVerifier(client);

    // Act
    const act = sut.verify("jwt-1", CONFIG.audience);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});
