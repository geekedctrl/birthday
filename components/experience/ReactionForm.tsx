"use client";
import { useEffect, useRef, useState } from "react";
import { selectVoiceType } from "@/lib/voice";

export default function ReactionForm() {
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const player = useRef<HTMLAudioElement>(null);
  const clearTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false; clearTimer();
    const current = recorder.current;
    if (current) { current.onstop = null; current.ondataavailable = null; if (current.state !== "inactive") current.stop(); current.stream.getTracks().forEach(track => track.stop()); }
  }; }, []);
  useEffect(() => {
    if (!voice) { setPreview(""); return; }
    const url = URL.createObjectURL(voice); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [voice]);
  const stopRecording = () => { clearTimer(); if (recorder.current?.state === "recording") recorder.current.stop(); };
  const record = async () => {
    if (recording || requesting || sending) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError("Voice recording isn't available in this browser. You can still leave a written message."); return; }
    setRequesting(true); setError(""); player.current?.pause();
    let stream: MediaStream | undefined;
    try {
      const probe = document.createElement("audio");
      const mimeType = selectVoiceType(type => MediaRecorder.isTypeSupported(type), type => probe.canPlayType(type));
      if (!mimeType) { setError("This browser doesn't support a voice recording format it can play. Please try another browser or leave a written message."); return; }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const current = new MediaRecorder(stream, { mimeType });
      recorder.current = current;
      const chunks: Blob[] = [];
      current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      current.onstop = () => {
        clearTimer(); current.stream.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false);
        // The emitted data identifies the actual encoded format. Never relabel it as WebM.
        const blob = new Blob(chunks, { type: chunks[0]?.type || mimeType });
        if (blob.size && blob.size <= 5_000_000) setVoice(blob);
        else setError("That recording couldn't be saved. Please try a shorter one.");
      };
      current.onerror = () => { stopRecording(); if (mounted.current) setError("Recording was interrupted. Please try again."); };
      current.start(); setVoice(null); setSeconds(0); setRecording(true);
      const started = Date.now();
      timer.current = setInterval(() => { const elapsed = Math.min(60, Math.floor((Date.now() - started) / 1000)); setSeconds(elapsed); if (elapsed >= 60) stopRecording(); }, 250);
    } catch { stream?.getTracks().forEach(track => track.stop()); if (mounted.current) setError("Microphone access wasn't available. Try again or leave a written message."); }
    finally { if (mounted.current) setRequesting(false); }
  };
  const replay = async () => {
    const audio = player.current;
    if (!audio || sending || requesting) return;
    setError("");
    audio.pause();
    try {
      // Keep the decoded recording available for repeated playback.
      // Reload only if the browser cannot seek the recorder's output.
      try { audio.currentTime = 0; } catch { audio.load(); }
      await audio.play();
    }
    catch (cause) {
      if (mounted.current) setError(cause instanceof Error
        ? `The preview couldn't play: ${cause.message}`
        : "The preview couldn't play. Tap Replay to try again.");
    }
  };
  const remove = () => { player.current?.pause(); setVoice(null); setPreview(""); setSeconds(0); setError(""); };
  const send = async () => {
    if (sending || recording || requesting) return;
    setSending(true); setError(""); player.current?.pause();
    try {
      const body = new FormData(); body.append("emoji", emoji); body.append("text", text);
      if (voice) body.append("voice", voice, voice.type.includes("mp4") ? "reaction.m4a" : voice.type.includes("ogg") ? "reaction.ogg" : "reaction.webm");
      const response = await fetch("/api/reactions", { method: "POST", body });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Your message couldn't be saved. Please try again."); }
      if (mounted.current) { setSent(true); setVoice(null); }
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Please try sending again."); }
    finally { if (mounted.current) setSending(false); }
  };
  return <div className="reaction-form mx-auto max-w-xl px-6 text-center text-forest">
    <p className="eyebrow">Your turn</p><h1 className="display mt-4">How are you feeling?</h1>
    {sent ? <p className="mt-12 text-lg" role="status">Keeping this close to my heart.</p> : <>
      <div className="reaction-emojis">{["😭", "🥹", "❤️", "😂", "🫶"].map(item => <button disabled={sending} aria-pressed={emoji === item} className={`emoji ${emoji === item ? "emoji-selected" : ""}`} key={item} onClick={() => setEmoji(item)}>{item}</button>)}</div>
      <textarea aria-label="Reaction message" className="reaction-input" placeholder="Leave me a little love…" maxLength={1000} disabled={sending} value={text} onChange={event => setText(event.target.value)} />
      <div className="voice-note">
        {recording ? <><p className="recording-timer" role="timer" aria-label="Recording duration"><span aria-hidden="true">●</span> 0:{String(seconds).padStart(2,"0")} <small>/ 1:00</small></p><button className="button button-outline" onClick={stopRecording}>Stop recording</button></> : preview ? <>
          <p className="voice-caption">A little piece of your voice. Listen before you send.</p>
          <audio key={preview} ref={player} controls preload="metadata" src={preview} aria-label="Preview your voice message" onError={() => setError(`This browser couldn't load the ${voice?.type || "audio"} recording. Please re-record your message.`)} />
          <div className="voice-actions"><button onClick={replay} disabled={sending || requesting}>Replay</button><button onClick={record} disabled={sending || requesting}>{requesting ? "Waiting for microphone…" : "Re-record"}</button><button onClick={remove} disabled={sending || requesting}>Delete recording</button></div>
        </> : <button className="button button-outline" disabled={sending || requesting} onClick={record}>{requesting ? "Waiting for microphone…" : "Record a voice message"}</button>}
      </div>
      <button className="button reaction-send" onClick={send} disabled={sending || recording || requesting || (!emoji && !text.trim() && !voice)}>{sending ? "Sending…" : "Send it"}</button>
      {error && <p role="alert" className="mt-4 text-sm">{error}</p>}
    </>}
  </div>;
}
