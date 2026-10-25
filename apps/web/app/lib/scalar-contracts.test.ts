import { describe, expect, it, vi } from "vite-plus/test";

import { matchStripeCustomerToUser } from "./bulk-import-helpers";
import { formatRelativeTime } from "./date-utils";
import { replacePlaceholders } from "./sql";
import { decodeTime, encodeTime } from "./ulid";

describe("typed scalar compatibility contracts", () => {
  it("formats each accepted SQL scalar without generic object stringification", () => {
    const missing = new URLSearchParams().get("absent");
    expect(
      replacePlaceholders({
        sql: "VALUES (?, ?, ?, ?, ?, ?)",
        params: ["O'Neil", 0, false, new Date("2026-10-25T12:00:00Z"), missing, undefined],
      }),
    ).toBe("VALUES ('O''Neil', 0, 0, '2026-10-25T12:00:00.000Z', NULL, NULL)");
  });

  it("formats established string and Date inputs identically", () => {
    const date = new Date("2020-01-02T12:00:00Z");
    expect(formatRelativeTime(date, "en-US")).toBe(formatRelativeTime(date.toISOString(), "en-US"));
  });

  it("retains null for an unmatched Stripe customer", () => {
    expect(
      matchStripeCustomerToUser({ id: "cus_missing", email: "person@example.com", created: 0 }, [])
        .matchedUser,
    ).toBeNull();
  });

  it("distinguishes missing membership prices from unknown prices", async () => {
    vi.stubEnv("VITE_STRIPE_PRICE_ID_FULL", "price_test_full");
    vi.stubEnv("VITE_STRIPE_PRICE_ID_FLEX", "price_test_flex");
    try {
      const { getMembershipByPriceId } = await import("./memberships");
      expect(getMembershipByPriceId(new URLSearchParams().get("missing-price"))).toBeNull();
      expect(getMembershipByPriceId("unknown")).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("decodes ULID timestamps at the allowed range boundaries", () => {
    for (const timestamp of [0, 1, 2 ** 48 - 1]) {
      expect(decodeTime(`${encodeTime(timestamp)}0000000000000000`)).toBe(timestamp);
    }
  });
});
