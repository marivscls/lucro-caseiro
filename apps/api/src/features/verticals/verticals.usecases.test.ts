import { ValidationError } from "../../shared/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IVerticalsRepo } from "./verticals.types";
import { VerticalsUseCases } from "./verticals.usecases";

const USER_ID = "10000000-0000-4000-8000-000000000001";
const PRODUCT_ID = "20000000-0000-4000-8000-000000000002";
const ASSET_ID = "30000000-0000-4000-8000-000000000003";

describe("VerticalsUseCases trust boundaries", () => {
  let repo: IVerticalsRepo;
  let ownsProducts: ReturnType<typeof vi.fn>;
  let ownsAsset: ReturnType<typeof vi.fn>;
  let createSerial: ReturnType<typeof vi.fn>;
  let createDocument: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ownsProducts = vi.fn().mockResolvedValue(true);
    ownsAsset = vi.fn().mockResolvedValue(true);
    createSerial = vi.fn();
    createDocument = vi.fn();
    repo = {
      ownsProducts,
      ownsAsset,
      createSerial,
      createDocument,
      ownsClient: vi.fn().mockResolvedValue(true),
      ownsDocumentKind: vi.fn().mockResolvedValue(true),
      ownsSale: vi.fn().mockResolvedValue(true),
    } as unknown as IVerticalsRepo;
  });

  it("rejects a serial attached to another account's product", async () => {
    ownsProducts.mockResolvedValue(false);
    const useCases = new VerticalsUseCases(repo);

    await expect(
      useCases.createSerial(USER_ID, "revenda", {
        productId: PRODUCT_ID,
        serial: "ABC-123",
        cost: 0,
        metadata: {},
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(createSerial).not.toHaveBeenCalled();
  });

  it("rejects a service order attached to another account's asset", async () => {
    ownsAsset.mockResolvedValue(false);
    const useCases = new VerticalsUseCases(repo);

    await expect(
      useCases.createDocument(USER_ID, {
        domain: "oficina",
        kind: "service_order",
        title: "OS 1",
        amount: 0,
        cost: 0,
        progress: 0,
        payload: {
          assetId: ASSET_ID,
          reportedIssue: "Não liga",
          priority: "normal",
          approvalStatus: "pending",
          accessories: [],
          photos: [],
        },
        items: [],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(createDocument).not.toHaveBeenCalled();
  });

  it("rejects skipping the resale serial state machine", async () => {
    const useCases = new VerticalsUseCases(repo);

    await expect(
      useCases.updateSerialStatus(
        USER_ID,
        "revenda",
        "40000000-0000-4000-8000-000000000004",
        "available",
        "returned",
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
