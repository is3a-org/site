import { renderToStaticMarkup } from "react-dom/server";
import { MagicLinkEmail } from "~/components/email/magic-link-email";

const POSTMARK_TOKEN = process.env.POSTMARK_SERVER_API_TOKEN || undefined;
const SENDER = "no-reply@is3a.nl";

export function magicLinkTemplate(url: string): string {
  return renderToStaticMarkup(<MagicLinkEmail url={url} />);
}

export async function sendEmail(
  email: string,
  subject: string,
  htmlContent: string,
): Promise<void> {
  if (POSTMARK_TOKEN === undefined) {
    console.warn("No POSTMARK_SERVER_API_TOKEN is set, assume email is disabled");
    console.log(`Trying to send email to ${email} with subject: ${subject}`);
    return;
  }

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": POSTMARK_TOKEN,
    },
    body: JSON.stringify({
      From: SENDER,
      To: email,
      Subject: subject,
      HtmlBody: htmlContent,
      MessageStream: "outbound",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${errorText}`);
  }
}
