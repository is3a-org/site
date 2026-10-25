import { z } from "zod";

import { formJsonObjectSchema } from "~/components/ui/form-builder/form-schema-contracts";

import type { FormSubmission } from "./forms-client";

const submissionSchema = z.object({
  id: z.string(),
  formId: z.string().nullable(),
  formVersion: z.number(),
  data: formJsonObjectSchema,
  submittedAt: z.iso.datetime({ offset: true }).transform((timestamp) => new Date(timestamp)),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
});
const submissionsPageSchema = z.object({
  submissions: z.array(submissionSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

/** Load every submission, validating JSON pages and restoring their date values. */
export async function loadAllFormSubmissions(
  formId: string,
  fetcher: typeof fetch = fetch,
): Promise<FormSubmission[]> {
  const submissions: FormSubmission[] = [];
  const visitedCursors = new Set<string>();
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (cursor !== undefined) {
      query.set("cursor", cursor);
    }
    const response = await fetcher(
      `/api/forms/admin/forms/${encodeURIComponent(formId)}/submissions?${query}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to load submissions (${response.status})`);
    }
    const page = submissionsPageSchema.parse(await response.json());
    submissions.push(...page.submissions);
    cursor = page.hasNextPage ? (page.nextCursor ?? undefined) : undefined;
    if (page.hasNextPage && (cursor === undefined || cursor.length === 0)) {
      throw new Error("Form submissions page has no continuation cursor");
    }
    if (cursor !== undefined) {
      if (visitedCursors.has(cursor)) {
        throw new Error("Form submissions page repeated a continuation cursor");
      }
      visitedCursors.add(cursor);
    }
  } while (cursor !== undefined);

  return submissions;
}
