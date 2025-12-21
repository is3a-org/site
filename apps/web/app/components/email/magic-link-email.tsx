import { EmailLayout } from "./email-layout";

const styles = {
  button: {
    display: "inline-block",
    backgroundColor: "#c62828",
    color: "#ffffff",
    padding: "12px 24px",
    textDecoration: "none",
    borderRadius: "4px",
    fontWeight: "bold" as const,
    marginTop: "16px",
  },
} as const;

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <EmailLayout title="Log in to IS3A">
      <p>Click the button below to log in to your account:</p>
      <p>
        <a href={url} style={styles.button}>
          Log in to IS3A
        </a>
      </p>
      <p style={{ marginTop: "24px", fontSize: "14px", color: "#666666" }}>
        Or copy this link: {url}
      </p>
    </EmailLayout>
  );
}
