import type { JSX } from "react";

import { MagicLinkEmail } from "~/components/email/magic-link-email";

export default function EmailPreview(): JSX.Element {
  return <MagicLinkEmail url="https://is3a.nl/login/verify?token=abc123&email=test@example.com" />;
}
