import { describe, expect, it } from "vite-plus/test";

import { displaySubmissionValue, submissionFields } from "./submission-fields";

const dataSchema = {
  type: "object",
  properties: {
    email: { type: "string", title: "Email address", format: "email" },
    name: { type: "string", title: "Full name" },
    newsletter: { type: "boolean" },
  },
};
const uiSchema = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/name" },
    { type: "Group", elements: [{ type: "Control", scope: "#/properties/email" }] },
  ],
};

describe("Submission fields", () => {
  it("orders fields by layout, then schema, then keys only found in submissions", () => {
    const fields = submissionFields(dataSchema, uiSchema, [
      { data: { name: "Ada", graduation_year: 2021 } },
    ]);
    expect(fields.map(({ key, title }) => [key, title])).toEqual([
      ["name", "Full name"],
      ["email", "Email address"],
      ["newsletter", "Newsletter"],
      ["graduation_year", "Graduation year"],
    ]);
  });

  it("still lists submitted keys when the form has no schema", () => {
    expect(submissionFields(undefined, undefined, [{ data: { graduationYear: 2021 } }])).toEqual([
      { key: "graduationYear", title: "Graduation year", format: undefined },
    ]);
  });
});

describe("Submission values", () => {
  const field = { key: "value", title: "Value", format: undefined };

  it("links email fields and web addresses", () => {
    expect(displaySubmissionValue("ada@example.com", { ...field, format: "email" })).toEqual({
      kind: "link",
      text: "ada@example.com",
      href: "mailto:ada@example.com",
    });
    expect(displaySubmissionValue("https://linkedin.com/in/ada", field)).toEqual({
      kind: "link",
      text: "https://linkedin.com/in/ada",
      href: "https://linkedin.com/in/ada",
    });
  });

  it("does not link other strings, even ones that look like scripts", () => {
    expect(displaySubmissionValue("javascript:alert(1)", field)).toEqual({
      kind: "text",
      text: "javascript:alert(1)",
    });
  });

  it("reads booleans, lists, numbers, and missing values", () => {
    expect(displaySubmissionValue(true, field)).toEqual({ kind: "text", text: "Yes" });
    expect(displaySubmissionValue(["a", "b"], field)).toEqual({ kind: "text", text: "a, b" });
    expect(displaySubmissionValue(2021, field)).toEqual({ kind: "text", text: "2021" });
    expect(displaySubmissionValue(undefined, field)).toEqual({ kind: "empty" });
    expect(displaySubmissionValue("", field)).toEqual({ kind: "empty" });
  });
});
