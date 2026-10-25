import { z } from "zod";

import { readServerEnvironmentVariable } from "./server-environment";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const turnstileVerifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
});

export interface TurnstileResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstile(
  token: string | null,
  remoteIp?: string | null,
  fetcher: typeof fetch = fetch,
): Promise<TurnstileResult> {
  const secretKey = readServerEnvironmentVariable("CF_TURNSTILE_SECRET_KEY");

  if (!secretKey) {
    console.warn("CF_TURNSTILE_SECRET_KEY is not configured, assume not required");
    return { success: true };
  }

  if (token === null || token.length === 0) {
    return { success: false, error: "Turnstile verification required" };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp !== null && remoteIp !== undefined && remoteIp.length > 0) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetcher(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("Turnstile API error:", response.status, response.statusText);
      return { success: false, error: "Verification service unavailable" };
    }

    const result = turnstileVerifyResponseSchema.parse(await response.json());

    if (!result.success) {
      const reportedCodes = result["error-codes"]?.join(", ");
      const errorCodes =
        reportedCodes !== undefined && reportedCodes.length > 0 ? reportedCodes : "unknown";
      console.error("Turnstile verification failed:", errorCodes);
      return { success: false, error: "Verification failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Verification service unavailable" };
  }
}
