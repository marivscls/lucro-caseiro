import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import {
  ForbiddenError,
  LimitExceededError,
  NotFoundError,
  ValidationError,
} from "../errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Dados invalidos",
      details: err.flatten().fieldErrors,
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

  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: "FORBIDDEN",
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

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Algo deu errado. Tente novamente.",
  });
}
