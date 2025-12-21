const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export interface TurnstileResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstile(
  token: string | null,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  const secretKey = process.env.CF_TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("CF_TURNSTILE_SECRET_KEY is not configured, assume not required");
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Turnstile verification required" };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("Turnstile API error:", response.status, response.statusText);
      return { success: false, error: "Verification service unavailable" };
    }

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      const errorCodes = result["error-codes"]?.join(", ") || "unknown";
      console.error("Turnstile verification failed:", errorCodes);
      return { success: false, error: "Verification failed. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Verification service unavailable" };
  }
}
