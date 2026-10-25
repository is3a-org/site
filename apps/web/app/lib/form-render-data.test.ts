import { describe, expect, it } from "vite-plus/test";

import { formRenderDataSchema } from "./form-render-data";

describe("controlled JSON Forms data", () => {
  it("retains the same data and nested references across repeated change notifications", () => {
    const input = { profile: { name: "Ada" }, choices: [1, true] };
    for (let notification = 0; notification < 5; notification++) {
      const validated = formRenderDataSchema.parse(input);
      expect(validated).toBe(input);
      expect(validated.profile).toBe(input.profile);
      expect(validated.choices).toBe(input.choices);
    }
  });

  it("keeps cleared optional fields until the existing JSON serializer omits them", () => {
    const input = { optional: undefined, choices: [undefined, 2] };
    expect(formRenderDataSchema.parse(input)).toBe(input);
    expect(JSON.stringify(input)).toBe('{"choices":[null,2]}');
  });

  it("accepts intermediate numeric input while rejecting arbitrary callable fields", () => {
    expect(formRenderDataSchema.safeParse({ number: Number.NaN }).success).toBe(true);
    expect(formRenderDataSchema.safeParse({ field: () => "unparsed" }).success).toBe(false);
  });
});
