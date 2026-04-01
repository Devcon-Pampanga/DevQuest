// Root error boundary for App Router.
// Next.js looks for this file when it needs to render an error state.
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          backgroundColor: "#0a0a0f",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: 12, fontSize: 20 }}>Something went wrong</h2>
          {error.digest ? (
            <p style={{ color: "#52525B", fontSize: 12, marginBottom: 16 }}>
              Error ID: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              padding: "8px 20px",
              background: "#7C3AED",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

