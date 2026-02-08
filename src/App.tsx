import { useEffect, useState } from "react";
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

  async function submit() {
    if (!note.trim()) return;
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
    <div style={{ margin: "40px auto", width: 520 }}>
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">This will be logged</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
            <button aria-label="Close" />
          </div>
        </div>

        <div className="window-body">
          <p>You may submit up to 3 entries per day.</p>

          <label htmlFor="entry">Entry</label>
          <textarea
            id="entry"
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Type here…"
            style={{ width: "100%" }}
          />

          <div style={{ marginTop: 12 }}>
            <button onClick={submit} disabled={loading}>
              {loading ? "Logging…" : "Submit"}
            </button>
          </div>

          {status && (
            <div style={{ marginTop: 12 }}>
              {status.ok ? (
                <>
                  <p><strong>{status.message}</strong></p>
                  <p>
                    Reference:{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {status.ref}
                    </span>
                  </p>
                  <p>
                    Receipt:{" "}
                    <Link to={status.receiptUrl}>
                      {status.receiptUrl}
                    </Link>
                  </p>
                </>
              ) : (
                <p><strong>{status.error}</strong></p>
              )}
            </div>
          )}
        </div>

        <div className="status-bar">
          <p className="status-bar-field">
            System total: {counter ?? "…"} entries.
          </p>
          <p className="status-bar-field">
            No further action is required.
          </p>
        </div>
      </div>
    </div>
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

  // Verify UI
  const [verifyText, setVerifyText] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "match" | "mismatch">("idle");

  useEffect(() => {
    (async () => {
      setErr(null);
      setData(null);
      setVerifyText("");
      setVerifyStatus("idle");

      try {
        const res = await fetch(`/api/receipt/${encodeURIComponent(ref || "")}`);
        const j = await res.json();
        if (!j.ok) setErr(j.error || "Receipt not found.");
        else setData(j);
      } catch {
        setErr("Network error.");
      }
    })();
  }, [ref]);

  async function verify() {
    if (!data?.fingerprint) return;
    setVerifyStatus("checking");

    const local = (verifyText || "").trim();
    const hash = await sha256HexClient(local);

    if (hash === String(data.fingerprint)) setVerifyStatus("match");
    else setVerifyStatus("mismatch");
  }

  const title = `Receipt${ref ? ` — ${String(ref).toUpperCase()}` : ""}`;

  return (
    <div style={{ margin: "40px auto", width: 520 }}>
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">{title}</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
            <button aria-label="Close" />
          </div>
        </div>

        <div className="window-body">
          <p style={{ marginTop: 0 }}>
            <Link to="/">← Back</Link>
          </p>

          <p>
            Retain this reference for your records. Do not share this receipt.
          </p>

          {err && (
            <div className="dialog-box" style={{ marginTop: 12 }}>
              <p><strong>{err}</strong></p>
            </div>
          )}

          {data && (
            <>
              <fieldset style={{ marginTop: 12 }}>
                <legend>Record</legend>

                <div style={{ marginBottom: 8 }}>
                  <strong>{data.message}</strong>
                </div>

                <div style={{ marginBottom: 6 }}>
                  Reference:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {data.ref}
                  </span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  Timestamp:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {data.timestamp}
                  </span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  Fingerprint:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {String(data.fingerprint).slice(0, 16)}…
                  </span>
                </div>
              </fieldset>

              <fieldset style={{ marginTop: 12 }}>
                <legend>Verify (optional)</legend>

                <p style={{ marginTop: 0 }}>
                  Paste the original entry to verify it matches this receipt.
                </p>

                <label htmlFor="verify">Original entry</label>
                <textarea
                  id="verify"
                  rows={5}
                  value={verifyText}
                  onChange={(e) => setVerifyText(e.target.value)}
                  placeholder="Paste the original entry here…"
                  style={{ width: "100%" }}
                />

                <div style={{ marginTop: 10 }}>
                  <button onClick={verify} disabled={!verifyText.trim() || verifyStatus === "checking"}>
                    {verifyStatus === "checking" ? "Verifying…" : "Verify"}
                  </button>
                </div>

                {verifyStatus === "match" && (
                  <p style={{ marginTop: 10 }}>
                    <strong>Match.</strong> This entry corresponds to the receipt.
                  </p>
                )}

                {verifyStatus === "mismatch" && (
                  <p style={{ marginTop: 10 }}>
                    <strong>No match.</strong> This entry does not correspond to the receipt.
                  </p>
                )}
              </fieldset>
            </>
          )}
        </div>

        <div className="status-bar">
          <p className="status-bar-field">Retain this reference for your records.</p>
          <p className="status-bar-field">No further action is required.</p>
        </div>
      </div>
    </div>
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
