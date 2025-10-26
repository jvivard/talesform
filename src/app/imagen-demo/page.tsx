"use client";

import { useState } from "react";

export default function Page() {
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("A futuristic cityscape at sunset");
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Status ${res.status}`);
      const pred = json?.predictions?.[0];
      if (!pred?.bytesBase64Encoded) throw new Error("No image returned");
      const mime = pred?.mimeType || "image/png";
      setImg(`data:${mime};base64,${pred.bytesBase64Encoded}`);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || "Unknown error");
      setImg(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <h1>Imagen 3 Demo</h1>
      <label>
        Prompt:
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: 480, marginLeft: 8 }}
        />
      </label>
      <button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {img && (
        <div>
          <img src={img} alt="generated" style={{ maxWidth: 640 }} />
        </div>
      )}
    </div>
  );
}
