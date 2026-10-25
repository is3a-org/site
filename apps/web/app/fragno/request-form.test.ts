import { describe, expect, it } from "vite-plus/test";
import { ZodError } from "zod";

import { parseStripeCustomerIds, readFormText } from "./request-form";

describe("Authentication and billing form inputs", () => {
  it("reads text fields without changing empty or nonempty submitted values", () => {
    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("password", "");

    expect(readFormText(formData, "email")).toBe("member@example.com");
    expect(readFormText(formData, "password")).toBe("");
    expect(readFormText(formData, "missing")).toBeUndefined();
  });

  it("does not pass uploaded files to authentication or billing APIs as strings", () => {
    const formData = new FormData();
    formData.set("email", new File(["member@example.com"], "email.txt"));

    expect(readFormText(formData, "email")).toBeUndefined();
  });

  it("preserves the selected Stripe customer IDs and their order", () => {
    expect(parseStripeCustomerIds('["cus_second","cus_first"]')).toEqual([
      "cus_second",
      "cus_first",
    ]);
  });

  it.each(['["cus_valid",42]', '{"customerId":"cus_valid"}', '"cus_valid"'])(
    "rejects malformed customer ID selections: %s",
    (customerIdsJson) => {
      expect(() => parseStripeCustomerIds(customerIdsJson)).toThrow(ZodError);
    },
  );

  it("rejects invalid JSON before a bulk import begins", () => {
    expect(() => parseStripeCustomerIds("invalid JSON")).toThrow(SyntaxError);
  });
});
