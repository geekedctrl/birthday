"use client";

import { useState } from "react";

type Reaction = { id: string; emoji?: string; text?: string; audioPath?: string; createdAt: string };

export default function AdminReactionsPage() {
  const [token, setToken] = useState("");
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    const response = await fetch("/api/reactions", { headers: { "x-admin-token": token } });
    if (!response.ok) { setError("Could not authenticate."); return; }
    setError(""); setReactions(await response.json() as Reaction[]);
  };
  const remove = async (id: string) => { await fetch("/api/reactions", { method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ id }) }); setReactions(reactions.filter((reaction) => reaction.id !== id)); };
  return <main style={{ minHeight: "100vh", background: "#06140E", color: "#F7F3E8", padding: "3rem 1.5rem", fontFamily: "sans-serif" }}><div style={{ maxWidth: 720, margin: "auto" }}><p style={{ color: "#D5B86A", letterSpacing: ".25em", fontSize: 12 }}>PRIVATE ADMIN</p><h1 style={{ fontFamily: "serif", fontSize: 48, fontWeight: 400 }}>Reactions</h1><div style={{ display: "flex", gap: 8, margin: "2rem 0" }}><input aria-label="Admin token" type="password" placeholder="Admin token" value={token} onChange={(event) => setToken(event.target.value)} style={{ flex: 1, padding: 12, borderRadius: 999, border: "1px solid #657A4F", background: "#123D2A", color: "#F7F3E8" }} /><button onClick={load} style={{ borderRadius: 999, padding: "0 1.5rem", background: "#D5B86A", border: 0 }}>Load</button></div>{error && <p style={{ color: "#C98989" }}>{error}</p>}{reactions.map((reaction) => <article key={reaction.id} style={{ borderTop: "1px solid #31543F", padding: "1rem 0", display: "flex", justifyContent: "space-between", gap: 20 }}><div><strong style={{ fontSize: 28 }}>{reaction.emoji}</strong><p>{reaction.text}</p>{reaction.audioPath && <audio controls src={`/api/reactions/${reaction.id}/audio?token=${encodeURIComponent(token)}`} />}<small style={{ color: "#A8BFA3", display: "block", marginTop: 8 }}>{new Date(reaction.createdAt).toLocaleString()}</small></div><button onClick={() => remove(reaction.id)} style={{ alignSelf: "start", color: "#C98989", background: "transparent", border: 0 }}>Delete</button></article>)}</div></main>;
}
