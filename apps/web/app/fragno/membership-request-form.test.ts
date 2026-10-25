import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { membershipRequestForm } from "./membership-request-form";

// The forms fragment validates submissions by converting the JSON Schema to Zod.
const schema = z.fromJSONSchema(membershipRequestForm.dataSchema);

const request = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  university: "UvA",
  degree: "Computer Science",
  graduationYear: 2021,
};

describe("Membership request form", () => {
  it("accepts a request with or without a LinkedIn profile", () => {
    expect(schema.safeParse(request).success).toBe(true);
    expect(schema.safeParse({ ...request, linkedin: "https://linkedin.com/in/ada" }).success).toBe(
      true,
    );
  });

  it("rejects missing details, unknown universities, and malformed contact details", () => {
    const { degree: _degree, ...withoutDegree } = request;
    expect(schema.safeParse(withoutDegree).success).toBe(false);
    expect(schema.safeParse({ ...request, university: "TU Delft" }).success).toBe(false);
    expect(schema.safeParse({ ...request, email: "ada" }).success).toBe(false);
    expect(schema.safeParse({ ...request, linkedin: "my profile" }).success).toBe(false);
    expect(schema.safeParse({ ...request, graduationYear: 2021.5 }).success).toBe(false);
  });

  it("rejects fields the form does not ask for", () => {
    expect(schema.safeParse({ ...request, isAdmin: true }).success).toBe(false);
  });
});
