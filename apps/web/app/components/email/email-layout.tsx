import type { ReactNode } from "react";

// Apparently inline css is the way to go for emails
const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    lineHeight: "1.5",
    color: "#333333",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  logo: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  heading: {
    color: "#c62828",
    fontSize: "28px",
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    margin: "0 0 24px 0",
  },
  content: {
    marginTop: "24px",
  },
} as const;

export function EmailLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          <div style={styles.logo}>
            <img
              src="https://lh3.googleusercontent.com/sitesv/AAzXCkcxi6jMfrtmx_EmINozYy6JquO5ZWc1vrQtCib_8bQlqRzfD6GA97MNYa58X8vXd_RIyMxjXpIH7LZ9BkJWk0dah77Ok0U_E8I4f-PiF5JhnYDJNSqafLV-np4mL06ir8C3acmI5JnwJzbSDyGRS6CbUgoT2e0XAmszMFTlK1-24CFWE3QlnUOxsDg=w16383"
              alt="IS3A"
              width="120"
              height="60"
            />
          </div>
          <h1 style={styles.heading}>{title}</h1>
          <div style={styles.content}>{children}</div>
        </div>
      </body>
    </html>
  );
}
