import type { z } from "zod";

import type { StaticForm } from "@fragno-dev/forms";

/** A submission of the membership request form, matching its data schema. */
export interface MembershipRequestData {
  // The fragment takes submissions as an open record of values.
  [field: string]: number | string | undefined;
  name: string;
  email: string;
  university: string;
  degree: string;
  graduationYear: number;
  linkedin?: string;
}

/**
 * Requests to join IS3A, sent from the join page. Defined in code so the join page can render its
 * own fields; submissions are stored with the other forms and reviewed in the dashboard.
 */
export const membershipRequestForm = {
  id: "membership-request",
  slug: "membership-request",
  title: "Membership requests",
  description: "Requests to join IS3A, sent from the join page.",
  version: 1,
  // Typed as Zod's JSON Schema: the fragment validates submissions with z.fromJSONSchema.
  dataSchema: {
    type: "object",
    properties: {
      name: { type: "string", title: "Full name", minLength: 1, maxLength: 200 },
      email: { type: "string", title: "Email address", format: "email", maxLength: 320 },
      university: { type: "string", title: "University", enum: ["UvA", "VU"] },
      degree: { type: "string", title: "Degree program", minLength: 1, maxLength: 200 },
      graduationYear: { type: "integer", title: "Graduation year", minimum: 1950 },
      linkedin: { type: "string", title: "LinkedIn profile", format: "uri", maxLength: 500 },
    },
    required: ["name", "email", "university", "degree", "graduationYear"],
    additionalProperties: false,
  } satisfies z.core.JSONSchema.JSONSchema,
  uiSchema: {
    type: "VerticalLayout",
    elements: [
      { type: "Control", scope: "#/properties/name" },
      { type: "Control", scope: "#/properties/email" },
      { type: "Control", scope: "#/properties/university" },
      { type: "Control", scope: "#/properties/degree" },
      { type: "Control", scope: "#/properties/graduationYear" },
      { type: "Control", scope: "#/properties/linkedin" },
    ],
  },
} satisfies StaticForm;
