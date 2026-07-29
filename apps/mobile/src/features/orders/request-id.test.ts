import { describe, expect, it } from "vitest";

import { createOrderRequestId } from "./request-id";

describe("createOrderRequestId", () => {
  it("gera uma chave UUID v4 estável para identificar um salvamento", () => {
    const requestId = createOrderRequestId(() => 0.5);

    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
