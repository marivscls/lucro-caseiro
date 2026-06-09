import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { AccountUseCases } from "./account.usecases";

export function createAccountRouter(useCases: AccountUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  // Exclusao definitiva da conta do usuario autenticado (LGPD / lojas).
  router.delete("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.deleteAccount(userId);
      res.status(200).json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
