import { MagicLinkEmail } from "~/components/email/magic-link-email";

export default function EmailPreview() {
  return <MagicLinkEmail url="https://is3a.nl/login/verify?token=abc123&email=test@example.com" />;
}
