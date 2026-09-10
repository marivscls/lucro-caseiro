import {
  DEFAULT_BRAND_ID,
  resolveBrand,
  type BrandFeatures,
} from "@lucro-caseiro/brands";
import type { RequestHandler } from "express";

import { FeatureUnavailableError, ValidationError } from "../errors";

export function requireBrandFeature(feature: keyof BrandFeatures): RequestHandler {
  return (req, _res, next) => {
    const id = req.header("x-brand")?.trim() || DEFAULT_BRAND_ID;
    try {
      const brand = resolveBrand(id);
      // `feature` is constrained to the BrandFeatures contract, not request input.
      // eslint-disable-next-line security/detect-object-injection
      if (!brand.features[feature]) {
        next(new FeatureUnavailableError());
        return;
      }
      next();
    } catch {
      next(
        new ValidationError([
          "Não foi possível identificar o aplicativo. Atualize a página e tente novamente.",
        ]),
      );
    }
  };
}
