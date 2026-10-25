import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { createStripeClient } from "./stripe.server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Stripe admin client configuration", () => {
  it("reports a missing secret key when the client is requested", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    Reflect.deleteProperty(process.env, "STRIPE_SECRET_KEY");

    expect(() => createStripeClient()).toThrow("Stripe admin client requires STRIPE_SECRET_KEY");
  });

  it("rejects an empty secret key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    expect(() => createStripeClient()).toThrow("Stripe admin client requires STRIPE_SECRET_KEY");
  });

  it("creates a client when the secret key is configured", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_admin_client");

    expect(createStripeClient()).toBeInstanceOf(Stripe);
  });
});
