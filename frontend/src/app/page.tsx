export default function Home() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🌍 APK World</h1>
      <p style={{ fontSize: "1.25rem", color: "#94a3b8", marginBottom: "2rem" }}>
        Hello World! This app is alive.
      </p>
      <div
        style={{
          display: "inline-flex",
          gap: "1rem",
          fontSize: "0.875rem",
          color: "#64748b",
        }}
      >
        <a href="/api/health" style={{ color: "#38bdf8" }}>
          /api/health
        </a>
        <a href="/api/hello" style={{ color: "#38bdf8" }}>
          /api/hello
        </a>
      </div>
    </div>
  );
}
