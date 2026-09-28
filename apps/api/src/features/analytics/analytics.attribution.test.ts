import { describe, expect, it } from "vitest";
import { parseRecordOpen } from "./analytics.validation";

const open = {
  installationId: "22222222-2222-4222-8222-222222222222",
  platform: "android",
  appVersion: "1.2.2",
};

describe("installation attribution boundary", () => {
  it("accepts campaign identifiers without requiring attribution from older app versions", () => {
    expect(parseRecordOpen(open)).toEqual(open);
    expect(
      parseRecordOpen({
        ...open,
        attribution: {
          source: "instagram",
          medium: "social",
          campaign: "retomada_202609",
        },
      }),
    ).toMatchObject({ attribution: { source: "instagram" } });
  });

  it("rejects arbitrary referrer URLs and contact details", () => {
    expect(() =>
      parseRecordOpen({ ...open, attribution: { source: "person@example.com" } }),
    ).toThrow();
    expect(() =>
      parseRecordOpen({
        ...open,
        attribution: {
          source: "instagram",
          referrer: "https://private.test?token=secret",
        },
      }),
    ).toThrow();
  });
});
