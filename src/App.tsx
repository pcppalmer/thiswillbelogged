import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";

type SubmitResponse =
  | { ok: true; ref: string; receiptUrl: string; message: string; counter: number; remainingToday: number }
  | { ok: false; error: string; counter?: number; remainingToday?: number };

type CounterResponse = { ok: true; counter: number };

function Home() {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitResponse | null>(null);
  const [counter, setCounter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/counter");
      const data = (await res.json()) as CounterResponse;
      if (data.ok) setCounter(data.counter);
    })();
  }, []);

  const canSubmit = useMemo(() => note.trim().length > 0 && !loading, [note, loading]);

  async function submit() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = (await res.json()) as SubmitResponse;
      setStatus(data);
      if (data.ok) {
        setCounter(data.counter);
        setNote("");
      }
    } catch {
      setStatus({ ok: false, error: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 680, margin: "64px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>This will be logged.</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        You may submit up to <b>3</b> entries per day.
      </p>

      <div style={{ margin: "24px 0", padding: 16, border: "1px solid #222", borderRadius: 12 }}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={7}
          placeholder="Type here…"
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 10, border: "1px solid #444" }}
        />
        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #444",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Logging…" : "Submit"}
        </button>
      </div>

      {status && (
        <div style={{ padding: 16, border: "1px solid #444", borderRadius: 12 }}>
          {status.ok ? (
            <>
              <div style={{ fontSize: 18, marginBottom: 6 }}>
                <b>{status.message}</b>
              </div>
              <div style={{ opacity: 0.85 }}>
                Reference: <b>{status.ref}</b>
              </div>
              <div style={{ opacity: 0.85 }}>
                Receipt: <Link to={status.receiptUrl}>{status.receiptUrl}</Link>
              </div>
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                Remaining today: <b>{status.remainingToday}</b>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, marginBottom: 6 }}>
                <b>Request rejected.</b>
              </div>
              <div style={{ opacity: 0.85 }}>{status.error}</div>
              {typeof status.remainingToday === "number" && (
                <div style={{ marginTop: 8, opacity: 0.85 }}>
                  Remaining today: <b>{status.remainingToday}</b>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, opacity: 0.8 }}>
        Public counter: <b>{counter ?? "…"}</b> entries noted.
      </div>

      <footer style={{ marginTop: 48, opacity: 0.6, fontSize: 13 }}>
        Stores metadata only (reference + timestamp + daily count). Does not store your text.
      </footer>
    </main>
  );
}
async function sha256HexClient(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Receipt() {
  const { ref } = useParams();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // verification UI state
  const [verifyText, setVerifyText] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "match" | "mismatch" | "checking">("idle");

  useEffect(() => {
    (async () => {
      setErr(null);
      setData(null);
      setVerifyStatus("idle");
      setVerifyText("");

      const res = await fetch(`/api/receipt/${encodeURIComponent(ref || "")}`);
      const j = await res.json();
      if (!j.ok) setErr(j.error || "Receipt not found.");
      else setData(j);
    })();
  }, [ref]);

  async function verify() {
    if (!data?.fingerprint) return;
    setVerifyStatus("checking");

    const local = (verifyText || "").trim();
    const hash = await sha256HexClient(local);

    if (hash === data.fingerprint) setVerifyStatus("match");
    else setVerifyStatus("mismatch");
  }

  return (
    <main style={{ maxWidth: 680, margin: "64px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Receipt</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        <Link to="/">← Back</Link>
      </p>

      {err && (
        <div style={{ padding: 16, border: "1px solid #444", borderRadius: 12 }}>
          <b>{err}</b>
        </div>
      )}

      {data && (
        <>
          <div style={{ padding: 16, border: "1px solid #444", borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>
              <b>{data.message}</b>
            </div>
            <div style={{ opacity: 0.85 }}>
              Reference: <b>{data.ref}</b>
            </div>
            <div style={{ opacity: 0.85 }}>
              Timestamp: <b>{data.timestamp}</b>
            </div>
            <div style={{ opacity: 0.85 }}>
              Fingerprint: <b>{String(data.fingerprint).slice(0, 16)}</b>
              <span style={{ opacity: 0.6 }}>…</span>
            </div>
          </div>

          <div style={{ padding: 16, border: "1px solid #222", borderRadius: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <b>Verify</b> (optional)
            </div>
            <div style={{ opacity: 0.8, marginBottom: 10 }}>
              Paste the original entry to verify it matches this receipt. This check happens in your browser.
            </div>

            <textarea
              value={verifyText}
              onChange={(e) => setVerifyText(e.target.value)}
              rows={5}
              placeholder="Paste the original entry here…"
              style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 10, border: "1px solid #444" }}
            />

            <button
              onClick={verify}
              disabled={!verifyText.trim() || verifyStatus === "checking"}
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #444",
                cursor: verifyText.trim() ? "pointer" : "not-allowed",
              }}
            >
              {verifyStatus === "checking" ? "Verifying…" : "Verify"}
            </button>

            {verifyStatus === "match" && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #2b2" }}>
                <b>Match.</b> This entry corresponds to the receipt.
              </div>
            )}

            {verifyStatus === "mismatch" && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #b22" }}>
                <b>No match.</b> This entry does not correspond to the receipt.
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/r/:ref" element={<Receipt />} />
    </Routes>
  );
}
