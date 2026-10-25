import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { loadAllFormSubmissions } from "./form-submissions";

const submission = {
  id: "submission-one",
  formId: "form/one",
  formVersion: 1,
  data: { amount: 0, nested: { accepted: true } },
  submittedAt: "2026-10-25T12:00:00.000Z",
  ip: "127.0.0.1",
  userAgent: "test-agent",
};

async function awaitFetchDelivery(): Promise<void> {
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
}

describe("all form submission loading", () => {
  it("follows page cursors and restores serialized submission dates", async () => {
    const requests: string[] = [];
    const submissions = await loadAllFormSubmissions(
      "form/one",
      async (input): Promise<Response> => {
        await awaitFetchDelivery();
        requests.push(z.string().parse(input));
        return Response.json(
          requests.length === 1
            ? { submissions: [submission], nextCursor: "next page", hasNextPage: true }
            : { submissions: [], nextCursor: "", hasNextPage: false },
        );
      },
    );
    expect(requests).toEqual([
      "/api/forms/admin/forms/form%2Fone/submissions?pageSize=100",
      "/api/forms/admin/forms/form%2Fone/submissions?pageSize=100&cursor=next+page",
    ]);
    expect(submissions.at(0)?.submittedAt).toEqual(new Date(submission.submittedAt));
    expect(submissions.at(0)?.data).toEqual(submission.data);
  });

  it("rejects malformed submission pages instead of trusting their declared type", async () => {
    await expect(
      loadAllFormSubmissions("form", async (): Promise<Response> => {
        await awaitFetchDelivery();
        return Response.json({
          submissions: [{ ...submission, submittedAt: "not a date" }],
          nextCursor: "",
          hasNextPage: false,
        });
      }),
    ).rejects.toThrow(/ISO datetime/);
  });

  it("rejects repeated cursors instead of loading forever", async () => {
    await expect(
      loadAllFormSubmissions("form", async (): Promise<Response> => {
        await awaitFetchDelivery();
        return Response.json({ submissions: [], nextCursor: "same-page", hasNextPage: true });
      }),
    ).rejects.toThrow("repeated a continuation cursor");
  });
});
