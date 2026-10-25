import { createFormsClient } from "@fragno-dev/forms/react";
import { useEffect, useState } from "react";

export const formsClient: ReturnType<typeof createFormsClient> = createFormsClient();

type SubmissionsPage = NonNullable<ReturnType<typeof formsClient.useSubmissions>["data"]>;
export type FormSubmission = SubmissionsPage["submissions"][number];

/** Form submissions remain undefined until the first complete load succeeds. */
export interface FormSubmissionsState {
  data: FormSubmission[] | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Loads every submission of a form. The submissions route is paginated, so this follows its
 * cursor until the last page.
 */
export function useAllSubmissions(formId: string): FormSubmissionsState {
  const [data, setData] = useState<FormSubmission[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<FormSubmission[]> {
      const submissions: FormSubmission[] = [];
      let cursor: string | null = null;

      do {
        const query = new URLSearchParams({ pageSize: "100" });
        if (cursor) {
          query.set("cursor", cursor);
        }
        const response = await fetch(
          `/api/forms/admin/forms/${encodeURIComponent(formId)}/submissions?${query}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load submissions (${response.status})`);
        }
        const page = (await response.json()) as SubmissionsPage;
        submissions.push(...page.submissions);
        cursor = page.hasNextPage ? page.nextCursor : null;
      } while (cursor);

      return submissions;
    }

    setLoading(true);
    load()
      .then((submissions) => {
        if (!cancelled) {
          setData(submissions);
          setError(undefined);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return (): void => {
      cancelled = true;
    };
  }, [formId]);

  return { data, loading, error };
}
