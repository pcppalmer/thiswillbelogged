import { useState } from "react";

export default function App() {
  const [note, setNote] = useState("");

  return (
    <main style={{ maxWidth: 720, margin: "64px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>This will be logged.</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>You may submit up to <b>3</b> entries per day.</p>

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #222", borderRadius: 12 }}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={7}
          placeholder="Type here…"
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 10, border: "1px solid #444" }}
        />
        <button
          style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #444" }}
          onClick={() => alert("Next we’ll wire this to /api/submit")}
        >
          Submit
        </button>
      </div>

      <footer style={{ marginTop: 48, opacity: 0.6, fontSize: 13 }}>
        This project stores metadata only. It does not store your text.
      </footer>
    </main>
  );
}
