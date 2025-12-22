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
          <div style={styles.logo}></div>
          <h1 style={styles.heading}>{title}</h1>
          <div style={styles.content}>{children}</div>
        </div>
      </body>
    </html>
  );
}
