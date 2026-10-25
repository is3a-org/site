import { createFormsClient } from "@fragno-dev/forms/react";
import { useEffect, useState } from "react";

import { loadAllFormSubmissions } from "./form-submissions";

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
interface LoadedFormSubmissions {
  readonly formId: string;
  readonly data: FormSubmission[] | undefined;
  readonly error: Error | undefined;
}

export function useAllSubmissions(formId: string): FormSubmissionsState {
  const [loaded, setLoaded] = useState<LoadedFormSubmissions>();

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const submissions = await loadAllFormSubmissions(formId);
        if (!cancelled) {
          setLoaded({ formId, data: submissions, error: undefined });
        }
      } catch (error_) {
        if (!cancelled) {
          const error =
            error_ instanceof Error
              ? error_
              : new Error("Failed to load submissions", { cause: error_ });
          setLoaded({ formId, data: undefined, error });
        }
      }
    }

    void load();
    return (): void => {
      cancelled = true;
    };
  }, [formId]);

  if (loaded?.formId !== formId) {
    return { data: undefined, loading: true, error: undefined };
  }
  return { data: loaded.data, loading: false, error: loaded.error };
}
