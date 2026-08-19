import { parseVerticalPayload } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  canTransitionVerticalDocument,
  initialVerticalStatus,
  verticalDocumentTotals,
} from "./verticals.domain";

describe("vertical documents", () => {
  it("starts each published vertical in its operational state", () => {
    expect(initialVerticalStatus("revenda", "import_purchase")).toBe("draft");
    expect(initialVerticalStatus("oficina", "service_order")).toBe("received");
    expect(initialVerticalStatus("obra", "project")).toBe("planned");
  });

  it("only advances through an explicit workflow", () => {
    const order = {
      domain: "oficina",
      kind: "service_order",
      status: "received",
    } as const;
    expect(canTransitionVerticalDocument(order, "diagnosis")).toBe(true);
    expect(canTransitionVerticalDocument(order, "delivered")).toBe(false);
  });

  it("calculates value and cost from document items", () => {
    expect(
      verticalDocumentTotals([
        {
          name: "Peça",
          quantity: 2,
          unit: "un",
          unitCost: 10.25,
          unitPrice: 18.5,
          metadata: {},
        },
        {
          name: "Serviço",
          quantity: 1,
          unit: "un",
          unitCost: 0,
          unitPrice: 50,
          metadata: {},
        },
      ]),
    ).toEqual({ amount: 87, cost: 20.5 });
  });

  it("rejects a document kind from another domain", () => {
    expect(() => parseVerticalPayload("obra", "service_order", {})).toThrow(
      /não pertence ao domínio/,
    );
  });

  it("validates domain-specific required links", () => {
    expect(() =>
      parseVerticalPayload("oficina", "service_order", {
        reportedIssue: "Não liga",
      }),
    ).toThrow();
  });
});
