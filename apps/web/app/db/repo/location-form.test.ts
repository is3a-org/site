import { assert, describe, expect, it } from "vite-plus/test";

import { parseLocationFormData } from "./location-form";

describe("Location form storage contract", () => {
  it("preserves explicit nulls when optional contact columns are cleared", () => {
    const formData = new FormData();
    formData.set("name", "Conference Center");
    formData.set("email", "");
    formData.set("address", "");
    formData.set("website", "");
    const result = parseLocationFormData(formData);

    assert(result.success);
    expect(Object.hasOwn(result.data, "email")).toBe(true);
    expect(Object.hasOwn(result.data, "address")).toBe(true);
    expect(Object.hasOwn(result.data, "website")).toBe(true);
    expect(result.data.email).toBeNull();
    expect(result.data.address).toBeNull();
    expect(result.data.website).toBeNull();
  });

  it("retains submitted contact details and checkbox seasons", () => {
    const formData = new FormData();
    formData.set("name", "Conference Center");
    formData.set("email", "events@example.com");
    formData.set("address", "123 Main St");
    formData.set("website", "https://example.com");
    formData.set("seasonSummer", "on");
    const result = parseLocationFormData(formData);

    assert(result.success);
    expect(result.data).toEqual({
      name: "Conference Center",
      email: "events@example.com",
      address: "123 Main St",
      website: "https://example.com",
      seasonSummer: true,
      seasonAutumn: false,
      seasonWinter: false,
      seasonSpring: false,
    });
  });

  it("rejects uploaded files in location contact fields", () => {
    const formData = new FormData();
    formData.set("name", "Conference Center");
    formData.set("email", new File(["events@example.com"], "email.txt"));

    expect(parseLocationFormData(formData).success).toBe(false);
  });
});
