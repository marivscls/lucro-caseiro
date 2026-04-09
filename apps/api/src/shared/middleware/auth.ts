import { createClient } from "@supabase/supabase-js";
import { users } from "@lucro-caseiro/database/schema";

import type { NextFunction, Request, Response } from "express";

import { config } from "../../config";
import { getDb } from "../db";

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export type AuthenticatedRequest = Request & { userId: string };

/** Extract userId from a request that has passed through authMiddleware */
export function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).userId;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Voce precisa estar logado" });
    return;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Sessao invalida" });
    return;
  }

  // Fallback: auto-create user if DB trigger hasn't been applied yet
  try {
    const db = getDb();
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuario",
      })
      .onConflictDoNothing();
  } catch {
    // Non-blocking: if auto-create fails, continue anyway
  }

  (req as AuthenticatedRequest).userId = user.id;
  next();
}
