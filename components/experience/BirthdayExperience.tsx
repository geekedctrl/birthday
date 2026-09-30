"use client";

import { useEffect, useRef, useState } from "react";
import BotanicalDetails, { Rose } from "./BotanicalDetails";
import SceneFit from "./SceneFit";
import WishCake from "./WishCake";
import { liveContent, setLiveContent } from "@/lib/content";
import { initialiseAudio, playTone } from "@/lib/audio";

type Scene = "gate" | "intro" | "cinema" | "cake" | "timeline" | "game" | "jar" | "montage" | "letter" | "gift" | "final" | "reaction";
const scenes: Scene[] = ["gate", "intro", "cinema", "cake", "timeline", "game", "jar", "montage", "letter", "gift", "final", "reaction"];

const sceneTitles: Record<Scene, string> = {
  gate: "Gate", intro: "Sound", cinema: "Cinema", cake: "Cake", timeline: "Story", game: "Game", jar: "Jar", montage: "Cinema", letter: "Letter", gift: "Gift", final: "Final", reaction: "Reaction"
};

function unlockTime() {
  const value = liveContent.birthdayConfig.birthday.date;
  if (!value || value.includes("[")) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function musicForScene(scene: Scene) {
  return scene === "gate" ? "" : liveContent.birthdayConfig.music.intro;
}

export default function BirthdayExperience() {
  const [scene, setScene] = useState<Scene>("gate");
  const [unlocked, setUnlocked] = useState(process.env.NEXT_PUBLIC_BYPASS_BIRTHDAY_GATE === "true");
  const [muted, setMuted] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const music = useRef<HTMLAudioElement>(null);
  const [leaving, setLeaving] = useState(false);
  const navigating = useRef(false);
  const transitionTimers = useRef<number[]>([]);
  useEffect(() => () => transitionTimers.current.forEach(window.clearTimeout), []);

  useEffect(() => {
    const controller = new AbortController();
    const initialise = async () => {
      try {
        const response = await fetch("/api/content", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Could not load birthday content");
        const content = await response.json();
        if (controller.signal.aborted) return;
        setLiveContent(content);
      } catch {
        if (controller.signal.aborted) return;
        // Retain the default content when the content service is unavailable.
      }
      try {
        const saved = window.localStorage.getItem("birthday-scene");
        if (saved && scenes.includes(saved as Scene)) setScene(saved as Scene);
      } catch { /* Storage may be unavailable in private browsing. */ }
      setUnlocked(process.env.NEXT_PUBLIC_BYPASS_BIRTHDAY_GATE === "true" || Date.now() >= unlockTime());
      setReady(true);
    };
    void initialise();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => setUnlocked(process.env.NEXT_PUBLIC_BYPASS_BIRTHDAY_GATE === "true" || Date.now() >= unlockTime()), 1000);
    return () => window.clearInterval(timer);
  }, [ready]);
  useEffect(() => {
    if (music.current) music.current.muted = muted;
  }, [muted]);

  const go = (next: Scene, openingDelay = 0) => { if (navigating.current) return; navigating.current = true;
    if (next !== "gate") {
      const configuredPath = musicForScene(next);
      const audioPath = configuredPath.startsWith("public/") ? `/${configuredPath.slice("public/".length)}` : configuredPath;
      const player = music.current;
      if (player && audioPath) {
        if (player.getAttribute("src") !== audioPath) {
          player.src = audioPath;
          player.load();
        }
        player.muted = muted;
        void player.play().catch(() => undefined);
      } else {
        player?.pause();
      }
      void initialiseAudio().catch(() => undefined);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    transitionTimers.current.push(window.setTimeout(() => {
      setLeaving(true);
      transitionTimers.current.push(window.setTimeout(() => {
        setScene(next);
        setLeaving(false);
        navigating.current = false;
        window.localStorage.setItem("birthday-scene", next);
      }, reduced ? 0 : 320));
    }, reduced ? 0 : openingDelay));
  };

  const previousScene = scenes.indexOf(scene) > 1 ? scenes[scenes.indexOf(scene) - 1] : null;
  if (!ready) return <main className="experience-loading" aria-busy="true"><p role="status">A little love is on its way…</p></main>;
  if (!unlocked) return <BirthdayGate />;
  return (
    <main className="birthday-experience relative min-h-screen" data-scene={scene} data-can-go-back={Boolean(previousScene)}>
      {previousScene && <button className="scene-back control" onClick={() => go(previousScene)} disabled={leaving} aria-label="Go back to the previous section">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>Back</span>
      </button>}
      <audio ref={music} loop preload="auto" aria-hidden="true" />
      {scene !== "gate" && <ExperienceControls muted={muted} setMuted={setMuted} onRestart={() => { window.localStorage.removeItem("birthday-scene"); go("intro"); }} />}
      <div className={`scene-stage ${leaving ? "scene-leaving" : ""}`}>
      {(scene === "gate" || scene === "intro") && <SoundIntro onContinue={() => go("cinema")} />}
      {scene === "cinema" && <CinemaOpening onContinue={() => go("cake")} />}
      {scene === "cake" && <BirthdayCake onComplete={() => go("timeline")} />}
      {scene === "timeline" && <StoryTimeline onContinue={() => go("game")} />}
      {scene === "game" && <HeartGame onComplete={() => go("jar")} />}
      {scene === "jar" && <LoveJar onContinue={() => go("montage")} />}
      {scene === "montage" && <MemoryMontage onContinue={() => go("letter")} />}
      {scene === "letter" && <LoveLetter onContinue={() => go("gift")} />}
      {scene === "gift" && <GiftReveal onContinue={() => go("final")} />}
      {scene === "final" && <FinalScene onContinue={() => go("reaction")} />}
      {scene === "reaction" && <ReactionScene />}
      </div>
      {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_DEV_MENU === "true") && <DevMenu open={devOpen} setOpen={setDevOpen} current={scene} go={go} />}
      {muted && <span className="sr-only">Sound muted</span>}
      {sceneTitles[scene] && <span className="sr-only">Scene: {sceneTitles[scene]}</span>}
    </main>
  );
}

function BirthdayGate() {
  const [remaining, setRemaining] = useState(unlockTime() - Date.now());
  useEffect(() => { const timer = window.setInterval(() => setRemaining(Math.max(0, unlockTime() - Date.now())), 1000); return () => window.clearInterval(timer); }, []);
  const units = Number.isFinite(remaining) ? (() => { const seconds = Math.floor(remaining / 1000); return [["Days", Math.floor(seconds / 86400)], ["Hours", Math.floor(seconds / 3600) % 24], ["Minutes", Math.floor(seconds / 60) % 60], ["Seconds", seconds % 60]]; })() : [["", "Soon"]];
  return <SceneShell tone="night"><Stars /><div className="relative z-10 mx-auto max-w-md px-6 text-center"><p className="eyebrow">A private little world</p><h1 className="display mt-5">Something is waiting for you.</h1><p className="mt-10 text-sage">Unlocks in</p><div className="mt-4 flex justify-center gap-2">{units.map(([label, value]) => <div className="counter" key={String(label)}><strong>{typeof value === "number" ? String(value).padStart(2, "0") : value}</strong><small>{label}</small></div>)}</div></div></SceneShell>;
}

function SoundIntro({ onContinue }: { onContinue: () => void }) {
  const [opened, setOpened] = useState(false);
  return <SceneShell tone="forest"><div className="envelope-intro text-center">
    <p className="eyebrow">A little world, just for you</p>
    <h1 className="display">Something <em>for you.</em></h1>
    <button className={`love-envelope ${opened ? "envelope-open" : ""}`} aria-label={`Open your letter, ${liveContent.birthdayConfig.girlfriend.name}`} disabled={opened} onClick={() => setOpened(true)}>
      <span className="envelope-letter"><span>my favourite person.</span><span aria-hidden="true">♡</span></span>
      <span className="envelope-pocket" />
      <span className="envelope-flap" />
      <span className="envelope-address"><small>For</small><span>{liveContent.birthdayConfig.girlfriend.name}</span></span>
      <span className="envelope-wax"><Rose /></span>
    </button>
    <p className="envelope-hint">{opened ? "Take your time. This little world can wait." : "Tap the seal. This little world is yours."}</p>
    {opened && <button className="button mt-5" onClick={onContinue}>Continue <span aria-hidden="true">→</span></button>}
    <p className="sound-note"><span aria-hidden="true">♫</span> Best enjoyed with your sound on</p>
  </div></SceneShell>;
}
function CinemaOpening({ onContinue }: { onContinue: () => void }) { return <SceneShell tone="cinema"><div className="mx-auto max-w-3xl px-6 text-center"><p className="eyebrow text-gold">The birthday premiere</p><h1 className="display mt-6 text-6xl sm:text-8xl">{liveContent.birthdayConfig.opening.cinemaTitle}</h1><p className="mx-auto mt-8 max-w-md text-sage">{liveContent.birthdayConfig.opening.cinemaSubtitle}</p><button className="button button-light mt-12" onClick={onContinue}>Open the story</button></div></SceneShell>; }

function BirthdayCake({ onComplete }: { onComplete: () => void }) {
  const [listening, setListening] = useState(false);
  const [breath, setBreath] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState("");
  const microphone = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const active = useRef(false);
  const mounted = useRef(true);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const stop = () => {
    active.current = false;
    cancelAnimationFrame(frame.current);
    microphone.current?.getTracks().forEach(track => track.stop());
    microphone.current = null;
    void audioContext.current?.close().catch(() => undefined);
    audioContext.current = null;
  };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); }; }, []);
  useEffect(() => {
    if (breath < 100) return;
    playTone(660);
    const timer = window.setTimeout(() => complete.current(), 3000);
    return () => window.clearTimeout(timer);
  }, [breath]);
  const blow = async () => {
    if (active.current || breath >= 100) return;
    if (!navigator.mediaDevices?.getUserMedia) { setError("Microphone access needs a supported browser and HTTPS."); return; }
    active.current = true;
    setListening(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return; }
      microphone.current = stream;
      const context = new AudioContext(); audioContext.current = context;
      await context.resume();
      if (!mounted.current) return;
      const analyser = context.createAnalyser(); analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let progress = breath;
      let previous = performance.now();
      const check = (now: number) => {
        if (!active.current) return;
        const elapsed = Math.min(now - previous, 100); previous = now;
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((total, value) => total + ((value - 128) / 128) ** 2, 0) / data.length);
        setMicLevel(Math.min(100, rms * 420));
        if (rms > 0.035) progress = Math.min(100, progress + elapsed / 35);
        setBreath(progress);
        if (progress >= 100) { stop(); setListening(false); setMicLevel(0); }
        else frame.current = requestAnimationFrame(check);
      };
      frame.current = requestAnimationFrame(check);
    } catch {
      stop();
      if (mounted.current) { setListening(false); setMicLevel(0); setError("Allow microphone access, then try again to make your wish."); }
    }
  };
  return <SceneShell tone="cream"><div className="wish-scene mx-auto max-w-xl px-6 text-center text-forest">
    <p className="eyebrow">Make a wish</p><h1 className="display mt-4">A little birthday ritual</h1>
    <WishCake progress={breath} />
    <div className="wish-status" role="status">{breath >= 100 ? <p className="wish-made display">Wish made, kuttyma.</p> : <p>{listening ? "Keep blowing… a little magic is happening." : "Make a wish, then blow gently into your microphone."}</p>}</div>
    <div className="breath-meter" aria-label={`Breath power ${Math.round(breath)} percent`}><div className="breath-meter-track"><span style={{ width: `${breath}%` }} /></div><div className="breath-meter-live"><span style={{ width: `${micLevel}%` }} /></div></div>
    <button className="button button-outline mt-4" onClick={blow} disabled={listening || breath >= 100}>{breath >= 100 ? "Made with a little magic" : listening ? "Listening…" : "Blow into mic"}</button>
    {error && <p role="alert" className="mt-4 text-sm">{error}</p>}
  </div></SceneShell>;
}
function StoryTimeline({ onContinue }: { onContinue: () => void }) {
  const [index, setIndex] = useState(0);
  const items = liveContent.timeline;
  const item = items[index % items.length];
  return <SceneShell tone="sage"><div className="story-editorial">
    <div className="story-heading"><p className="eyebrow">Chapter one · our story</p><h1 className="display">The little <br /><em>moments.</em></h1><p>A collection of days I’d live all over again.</p></div>
    <div className="timeline-card timeline-card-enter" key={index}>
      {item.photo && <img className="memory-image" src={item.photo} alt={item.title} />}
      <div className="memory-caption"><span className="memory-number">{String(index + 1).padStart(2, "0")}</span><div><span className="eyebrow">{item.date}</span><h2 className="display">{item.title}</h2><p>{item.description}</p></div></div>
    </div>
    <div className="memory-navigation"><button disabled={index === 0} onClick={() => setIndex(Math.max(0, index - 1))}>← Previous</button><span aria-live="polite">{String(index + 1).padStart(2, "0")} <span className="navigation-divider" /> {String(items.length).padStart(2, "0")}</span><button onClick={() => index + 1 >= items.length ? onContinue() : setIndex(index + 1)}>{index + 1 >= items.length ? "Continue" : "Next"} →</button></div>
  </div></SceneShell>;
}
function HeartGame({ onComplete }: { onComplete: () => void }) { const gameSeconds = 20; const [score, setScore] = useState(0); const [timeLeft, setTimeLeft] = useState(gameSeconds); const [running, setRunning] = useState(false); const [finished, setFinished] = useState(false); useEffect(() => { if (!running) return; const timer = window.setInterval(() => setTimeLeft((current) => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer); }, [running]); useEffect(() => { if (running && score >= 10) { setRunning(false); setFinished(true); } if (running && timeLeft === 0) { setRunning(false); setFinished(true); } }, [running, score, timeLeft]); const start = () => { setScore(0); setTimeLeft(gameSeconds); setFinished(false); setRunning(true); }; const hit = () => { setScore((current) => current + 1); playTone(500 + score * 20); }; const won = finished && score >= 10; return <SceneShell tone="game"><div className="mx-auto max-w-xl px-6 text-center"><p className="eyebrow text-gold">A tiny game</p><h1 className="display mt-4 text-5xl">Catch a little joy.</h1><div className="game-stats mt-8"><span><strong>{timeLeft}s</strong><small>Time</small></span><span><strong>{score}/10</strong><small>Hearts</small></span></div><div className="game-board mt-5">{running && <button aria-label="Catch heart" className="falling-heart" style={{ left: `${15 + ((score * 31) % 70)}%`, top: `${15 + ((score * 17) % 60)}%` }} onClick={hit}>♥</button>}<span className="text-sage">{!running && !finished ? "Ready when you are" : finished && !won ? "Time is up. Try again?" : finished ? "You caught them all." : "Catch the heart before time runs out"}</span></div>{!running ? <button className="button mt-8" onClick={won ? onComplete : start}>{won ? "Let's move on" : finished ? "Play again" : "Start"}</button> : null}</div></SceneShell>; }
function DanceScene({ onContinue }: { onContinue: () => void }) { const [skipped, setSkipped] = useState(false); return <SceneShell tone="forest"><div className="mx-auto max-w-xl px-6 text-center"><p className="eyebrow text-gold">Birthday protocol</p><h1 className="display mt-4 text-5xl">Okay, enough emotional stuff.</h1>{!skipped && <div className="dancers mt-12"><div className="dancer">🕺</div><div className="dancer dancer-two">💃</div></div>}<p className="mt-10 text-sage">{skipped ? "Fair enough. The dancing was questionable anyway." : "Initiating highly sophisticated dance sequence..."}</p><div className="mt-8 flex justify-center gap-3"><button className="button button-ghost" onClick={() => setSkipped(true)}>Skip</button><button className="button" onClick={onContinue}>Continue</button></div></div></SceneShell>; }
function LoveJar({ onContinue }: { onContinue: () => void }) {
  return <SceneShell tone="cream"><div className="love-notes text-center">
    <p className="eyebrow">In all the little ways</p>
    <h1 className="display">So many reasons.<br /><em>All of them, you.</em></h1>
    <p className="love-notes-intro">A few little things I never want you to forget.</p>
    <ol className="love-notes-grid">
      {liveContent.reasons.map((reason, index) => <li className="love-note" key={index} style={{ animationDelay: `${Math.min(index, 5) * 120}ms` }}>
        <span className="love-note-number">{String(index + 1).padStart(2, "0")}</span>
        <p>{reason}</p>
        <span className="love-note-heart" aria-hidden="true">♡</span>
      </li>)}
    </ol>
    <p className="love-notes-signoff">And a hundred more, every day.</p>
    <button className="button" onClick={onContinue}>Keep going <span aria-hidden="true">→</span></button>
  </div></SceneShell>;
}
function VinylPlayer({ onContinue }: { onContinue: () => void }) { const [playing, setPlaying] = useState(false); const [audioError, setAudioError] = useState(false); const audio = useRef<HTMLAudioElement>(null); const configuredPath = liveContent.birthdayConfig.music.intro; const audioPath = configuredPath.startsWith("public/") ? `/${configuredPath.slice("public/".length)}` : configuredPath; const toggle = () => { if (!audio.current) return; if (playing) { audio.current.pause(); setPlaying(false); } else { audio.current.play().then(() => { setPlaying(true); playTone(330); }).catch(() => { setAudioError(true); setPlaying(false); }); } }; return <SceneShell tone="vinyl"><div className="mx-auto max-w-xl px-6 text-center"><p className="eyebrow text-gold">Side A</p><h1 className="display mt-4 text-5xl">A song for this moment.</h1><button aria-label="Play the record" className={`record mt-14 ${playing ? "record-playing" : ""}`} onClick={toggle}><span>[OUR_SONG]</span></button>{audioPath && <audio ref={audio} src={audioPath} loop preload="metadata" onError={() => setAudioError(true)} />}{<p className="mt-10 text-sage">{audioError ? "This song could not be loaded. Check the path in the content editor." : playing ? "The record is turning." : audioPath ? "Tap the label to place the needle." : "Add a vinyl song path in the content editor."}</p>}<button className="button mt-8" onClick={onContinue}>Continue</button></div></SceneShell>; }
function MemoryMontage({ onContinue }: { onContinue: () => void }) {
  const [index, setIndex] = useState(0);
  const items = liveContent.memories;
  const item = items[index % items.length];
  return <SceneShell tone="cinema"><div className="memory-cinema mx-auto text-center"><p className="eyebrow">The memory collection</p><div className="montage-frame timeline-card-enter" key={index}>{item.photo && <img className="montage-image" src={item.photo} alt={item.title} />}<div className="montage-caption"><span className="eyebrow">No. {String(index + 1).padStart(2, "0")}</span><h1 className="display">{item.title}</h1></div></div><p className="montage-count">{index + 1} / {items.length} memories to keep</p><button className="button" onClick={() => index + 1 >= items.length ? onContinue() : setIndex(index + 1)}>{index + 1 >= items.length ? "Turn the page" : "Next memory"} <span aria-hidden="true">→</span></button></div></SceneShell>;
}
function LoveLetter({ onContinue }: { onContinue: () => void }) { const [open, setOpen] = useState(false); return <SceneShell tone="paper"><div className="letter-scene-content mx-auto max-w-xl px-6 text-forest"><p className="eyebrow text-emerald text-center">A quiet page</p><div className={`letter mt-10 ${open ? "letter-open" : ""}`} role={open ? undefined : "button"} tabIndex={open ? undefined : 0} aria-label={open ? undefined : "Open your letter"} onKeyDown={(event) => { if (!open && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setOpen(true); } }} onClick={() => setOpen(true)}><p className="display text-3xl">{liveContent.letter.salutation}</p>{open ? liveContent.letter.paragraphs.map((paragraph) => <p className="mt-6 leading-7" key={paragraph}>{paragraph}</p>) : <p className="mt-10 text-sm text-moss">Tap to open</p>}{open && <p className="mt-10 font-display text-2xl">{liveContent.letter.signature}</p>}</div>{open && <button className="button button-outline mx-auto mt-8 block" onClick={onContinue}>Fold this into the next chapter</button>}</div></SceneShell>; }
function GiftReveal({ onContinue }: { onContinue: () => void }) { const [open, setOpen] = useState(false); return <SceneShell tone="gift"><div className="mx-auto max-w-xl px-6 text-center"><p className="eyebrow text-gold">One last little thing</p><h1 className="display mt-4 text-5xl">There is a present here.</h1><button aria-label="Open present" className={`present mt-12 ${open ? "present-open" : ""}`} onClick={() => setOpen(true)}><span>✦</span></button>{open && <div className="reveal mt-10"><h2 className="display text-4xl">{liveContent.gift.title}</h2><p className="mt-4 text-sage">{liveContent.gift.description}</p><button className="button mt-8" onClick={onContinue}>Open the final scene</button></div>}</div></SceneShell>; }
function FinalScene({ onContinue }: { onContinue: () => void }) {
  const configuredPhoto = liveContent.birthdayConfig.media.finalPhoto;
  const placeholder = "/photos/final-placeholder.svg";
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photo = !configuredPhoto || failedPhoto === configuredPhoto ? placeholder : configuredPhoto;
  return <SceneShell tone="night"><Stars /><div className="final-scene-content relative z-10 mx-auto max-w-xl px-6 text-center">
    <img className="final-image" src={photo} alt={photo === placeholder ? "A rose illustration marking the place for your favourite photo" : "A favourite memory"} onError={() => { if (photo !== placeholder) setFailedPhoto(configuredPhoto); }} />
    <p className="eyebrow text-gold">The end, for now</p>
    <h1 className="display mt-6 text-6xl">Happy Birthday, {liveContent.birthdayConfig.girlfriend.name}.</h1>
    <p className="mt-10 text-xl leading-8 text-sage">{liveContent.birthdayConfig.finalMessage}</p>
    <button className="button mt-12" onClick={onContinue}>Leave me a little love</button>
  </div></SceneShell>;
}
function ReactionScene() { const [emoji, setEmoji] = useState(""); const [text, setText] = useState(""); const [voice, setVoice] = useState<Blob | null>(null); const [recording, setRecording] = useState(false); const [sent, setSent] = useState(false); const [sending, setSending] = useState(false); const [sendError, setSendError] = useState(""); const recorder = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]); const recordingMounted = useRef(true); useEffect(() => { recordingMounted.current = true; return () => { recordingMounted.current = false; const current = recorder.current; if (current) { current.onstop = null; if (current.state !== "inactive") current.stop(); current.stream.getTracks().forEach(track => track.stop()); } }; }, []); const record = () => { if (!("MediaRecorder" in window)) return; if (recording) { recorder.current?.stop(); setRecording(false); return; } navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => { if (!recordingMounted.current) { stream.getTracks().forEach(track => track.stop()); return; } const instance = new MediaRecorder(stream); chunks.current = []; recorder.current = instance; instance.ondataavailable = (event) => chunks.current.push(event.data); instance.onstop = () => { stream.getTracks().forEach((track) => track.stop()); setVoice(new Blob(chunks.current, { type: instance.mimeType })); }; instance.start(); setRecording(true); window.setTimeout(() => { if (instance.state === "recording") { instance.stop(); setRecording(false); } }, 60000); }).catch(() => undefined); }; const send = async () => { if (sending) return; setSending(true); setSendError(""); try { const body = new FormData(); body.append("emoji", emoji); body.append("text", text); if (voice) body.append("voice", voice, "reaction.webm"); const response = await fetch("/api/reactions", { method: "POST", body }); if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Your message could not be saved. Please try again."); } setSent(true); } catch (error) { setSendError(error instanceof Error ? error.message : "Your message could not be saved. Please try again."); } finally { setSending(false); } }; return <SceneShell tone="sage"><div className="mx-auto max-w-xl px-6 text-center text-forest"><p className="eyebrow text-emerald">Your turn</p><h1 className="display mt-4 text-5xl">How are you feeling?</h1>{sent ? <p className="mt-12 text-lg">Keeping this close to my heart.</p> : <><div className="mt-10 flex justify-center gap-2">{["😭", "🥹", "❤️", "😂", "🫶"].map((item) => <button className={`emoji ${emoji === item ? "emoji-selected" : ""}`} key={item} onClick={() => setEmoji(item)}>{item}</button>)}</div><textarea aria-label="Reaction message" className="reaction-input mt-8" placeholder="Leave me a message..." value={text} onChange={(event) => setText(event.target.value)} /><button className="button button-outline mt-5" onClick={record}>{recording ? "Stop recording" : voice ? "Voice recorded ✓" : "Record a voice message"}</button><button className="button button-outline mt-3 block mx-auto" onClick={send} disabled={sending || (!emoji && !text && !voice)}>{sending ? "Sending…" : "Send it"}</button>{sendError && <p role="alert" className="mt-4 text-sm">{sendError}</p>}</>}</div></SceneShell>; }

function SceneShell({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <section className={`scene editorial-scene scene-${tone} grain`}>
    <div className="editorial-masthead"><span className="masthead-mark">a little love letter</span><span className="masthead-caption">a birthday edition</span></div>
    <BotanicalDetails petals={tone !== "game"} />
    <SceneFit>{children}</SceneFit>
    <div className="editorial-colophon"><span>Collected moments & little things</span><span className="colophon-flower" aria-hidden="true">✳</span><span>Made with love, for you</span></div>
  </section>;
}
function ExperienceControls({ muted, setMuted, onRestart }: { muted: boolean; setMuted: (value: boolean) => void; onRestart: () => void }) { return <div className="experience-controls fixed z-50 flex gap-2"><button className="control" onClick={() => setMuted(!muted)} aria-label={muted ? "Turn sound on" : "Mute sound"} aria-pressed={!muted}>{muted ? "Sound off" : "♫ Sound on"}</button><button className="control" onClick={onRestart} aria-label="Restart experience" title="Restart experience">↻</button></div>; }
function DevMenu({ open, setOpen, current, go }: { open: boolean; setOpen: (value: boolean) => void; current: Scene; go: (scene: Scene) => void }) { return <div className="fixed bottom-4 left-4 z-50"><button className="control" onClick={() => setOpen(!open)}>DEV</button>{open && <div className="dev-menu">{scenes.map((scene) => <button className={scene === current ? "active" : ""} key={scene} onClick={() => { go(scene); setOpen(false); }}>{sceneTitles[scene]}</button>)}</div>}</div>; }
function Stars() { return <div className="scene-stars" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <span className="star" key={index} style={{ left: `${(index * 37) % 100}%`, top: `${(index * 61) % 100}%`, animationDelay: `${index * 130}ms` }} />)}</div>; }
