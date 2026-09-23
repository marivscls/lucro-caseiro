import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "../../shared/errors";
import {
  PushTokenRejectedError,
  type IPushIdTokenVerifier,
} from "../../shared/middleware/pubsub-push-auth";
import type { PlayNotificationOutcome } from "./google-play-rtdn.usecases";
import { createGooglePlayRtdnRouter } from "./google-play-rtdn.routes";

const PACKAGE = "br.com.orionseven.lucrocaseiro";
const AUTH = {
  audience: "https://api.example.com/api/v1/webhooks/google-play",
  serviceAccountEmail: "rtdn-push@proj.iam.gserviceaccount.com",
};
const TOKEN = "secret-purchase-token";

function pushBody(notification: unknown) {
  return JSON.stringify({
    message: {
      messageId: "msg-1",
      data: Buffer.from(JSON.stringify(notification)).toString("base64"),
    },
    subscription: "projects/p/subscriptions/rtdn",
  });
}

const SUBSCRIPTION_BODY = pushBody({
  packageName: PACKAGE,
  subscriptionNotification: {
    notificationType: 2,
    purchaseToken: TOKEN,
    subscriptionId: "lucrocaseiro_professional_monthly",
  },
});

describe("POST /webhooks/google-play", () => {
  let server: ReturnType<express.Application["listen"]> | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) => {
      if (!server) return resolve();
      server.close((error) => (error ? reject(error) : resolve()));
      server = undefined;
    });
  });

  async function makeSut(
    options: {
      auth?: typeof AUTH;
      verify?: IPushIdTokenVerifier["verify"];
      handle?: () => Promise<PlayNotificationOutcome>;
    } = {},
  ) {
    const handleSubscriptionNotification = vi.fn(
      options.handle ??
        (() =>
          Promise.resolve<PlayNotificationOutcome>({
            decision: { action: "activate", plan: "professional", expiresAt: null },
            userId: "user-1",
          })),
    );
    const verify = vi.fn(
      options.verify ??
        (() =>
          Promise.resolve({ email: AUTH.serviceAccountEmail, email_verified: true })),
    );
    const app = express();
    app.disable("x-powered-by");
    app.use(
      "/webhooks",
      createGooglePlayRtdnRouter(
        { handleSubscriptionNotification },
        { packageName: PACKAGE, auth: options.auth ?? AUTH, verifier: { verify } },
      ),
    );
    const listening = app.listen(0, "127.0.0.1");
    server = listening;
    await new Promise<void>((resolve) => listening.once("listening", resolve));
    const address = listening.address();
    if (!address || typeof address === "string") throw new Error("Missing server port");

    const post = (body: string, authorization = "Bearer jwt-1") =>
      fetch(`http://127.0.0.1:${address.port}/webhooks/google-play`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization },
        body,
      });
    return { post, handleSubscriptionNotification, verify };
  }

  it("returns 503 and does nothing when the push auth env vars are missing", async () => {
    // Arrange
    const { post, handleSubscriptionNotification, verify } = await makeSut({
      auth: { audience: "", serviceAccountEmail: "" },
    });

    // Act
    const response = await post(SUBSCRIPTION_BODY);

    // Assert
    expect(response.status).toBe(503);
    expect(verify).not.toHaveBeenCalled();
    expect(handleSubscriptionNotification).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid OIDC token", async () => {
    // Arrange
    const { post, handleSubscriptionNotification } = await makeSut({
      verify: () => Promise.reject(new PushTokenRejectedError()),
    });

    // Act
    const response = await post(SUBSCRIPTION_BODY);

    // Assert
    expect(response.status).toBe(401);
    expect(handleSubscriptionNotification).not.toHaveBeenCalled();
  });

  it("returns 401 without a bearer token", async () => {
    // Arrange
    const { post } = await makeSut();

    // Act
    const response = await post(SUBSCRIPTION_BODY, "");

    // Assert
    expect(response.status).toBe(401);
  });

  it("processes a subscription notification and never logs the token", async () => {
    // Arrange
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { post, handleSubscriptionNotification } = await makeSut();

    // Act
    const response = await post(SUBSCRIPTION_BODY);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, result: "processed" });
    expect(handleSubscriptionNotification).toHaveBeenCalledWith(
      TOKEN,
      "lucrocaseiro_professional_monthly",
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain(TOKEN);
  });

  it("acknowledges the Play Console test notification without processing", async () => {
    // Arrange
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { post, handleSubscriptionNotification } = await makeSut();

    // Act
    const response = await post(
      pushBody({ packageName: PACKAGE, testNotification: { version: "1.0" } }),
    );

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, result: "ignored" });
    expect(handleSubscriptionNotification).not.toHaveBeenCalled();
  });

  it("acknowledges notifications for another package without processing", async () => {
    // Arrange
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { post, handleSubscriptionNotification } = await makeSut();

    // Act
    const response = await post(
      pushBody({
        packageName: "com.other",
        subscriptionNotification: { notificationType: 2, purchaseToken: TOKEN },
      }),
    );

    // Assert
    expect(response.status).toBe(200);
    expect(handleSubscriptionNotification).not.toHaveBeenCalled();
  });

  it("returns 503 on transient failures so Pub/Sub retries", async () => {
    // Arrange
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { post } = await makeSut({
      handle: () => Promise.reject(new ServiceUnavailableError("Google fora")),
    });

    // Act
    const response = await post(SUBSCRIPTION_BODY);

    // Assert
    expect(response.status).toBe(503);
  });

  it("returns 503 when Google certificates cannot be fetched", async () => {
    // Arrange
    const { post } = await makeSut({
      verify: () => Promise.reject(new ServiceUnavailableError("certs")),
    });

    // Act
    const response = await post(SUBSCRIPTION_BODY);

    // Assert
    expect(response.status).toBe(503);
  });
});
