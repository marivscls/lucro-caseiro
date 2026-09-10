import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { userErrorMessage, USER_ERROR_MESSAGES } from "@lucro-caseiro/contracts";

import {
  ConflictError,
  ForbiddenError,
  FeatureUnavailableError,
  LimitExceededError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "../errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if ((err as Error & { type?: string }).type === "entity.parse.failed") {
    res
      .status(400)
      .json({ error: "VALIDATION_ERROR", message: USER_ERROR_MESSAGES.validation });
    return;
  }
  if ((err as Error & { type?: string }).type === "entity.too.large") {
    res.status(413).json({
      error: "PAYLOAD_TOO_LARGE",
      message: "O corpo da requisicao excede o limite permitido.",
    });
    return;
  }
  if (err instanceof ZodError) {
    const validation = err.flatten((issue) =>
      userErrorMessage(issue.message, USER_ERROR_MESSAGES.validation),
    );
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Dados invalidos",
      details: {
        ...validation.fieldErrors,
        ...(validation.formErrors.length ? { _form: validation.formErrors } : {}),
      },
    });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Dados invalidos",
      details: err.errors,
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: "NOT_FOUND",
      message: err.message,
    });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({
      error: "CONFLICT",
      message: err.message,
    });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: err instanceof FeatureUnavailableError ? "FEATURE_UNAVAILABLE" : "FORBIDDEN",
      message: err.message,
    });
    return;
  }

  if (err instanceof LimitExceededError) {
    res.status(403).json({
      error: "LIMIT_EXCEEDED",
      message: err.message,
    });
    return;
  }

  if (err instanceof ServiceUnavailableError) {
    res.status(503).json({
      error: "SERVICE_UNAVAILABLE",
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Algo deu errado. Tente novamente.",
  });
}
