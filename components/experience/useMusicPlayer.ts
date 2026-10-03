"use client";
import { useEffect, useRef } from "react";

/** Start playback inside the user's gesture; blend old and new tracks without a hard cut. */
export function useMusicPlayer(muted: boolean) {
  const tracks = useRef<HTMLAudioElement[]>([]);
  const active = useRef<HTMLAudioElement | null>(null);
  const frame = useRef(0);
  const silent = useRef(muted);
  useEffect(() => { silent.current = muted; tracks.current.forEach(track => { track.muted = muted; }); }, [muted]);
  useEffect(() => () => { cancelAnimationFrame(frame.current); tracks.current.forEach(track => { track.pause(); track.removeAttribute("src"); track.load(); }); }, []);
  const play = (path: string) => {
    if (path.startsWith("public/")) path = `/${path.slice(7)}`;
    if (active.current?.getAttribute("src") === path) {
      active.current.muted = silent.current;
      void active.current.play().catch(() => undefined);
      return;
    }
    cancelAnimationFrame(frame.current);
    const old = tracks.current.filter(track => !track.paused);
    const levels = old.map(track => track.volume);
    const next = path ? new Audio(path) : null;
    if (next) { next.loop = true; next.volume = 0; next.muted = silent.current; tracks.current.push(next); void next.play().catch(() => undefined); }
    active.current = next;
    const start = performance.now();
    const fade = (now: number) => {
      const fraction = Math.min(1, (now - start) / 800);
      old.forEach((track,index) => { track.volume = levels[index] * (1 - fraction); });
      if (next) next.volume = .45 * fraction;
      if (fraction < 1) frame.current = requestAnimationFrame(fade);
      else { old.forEach(track => { track.pause(); track.removeAttribute("src"); track.load(); }); tracks.current = next ? [next] : []; }
    };
    frame.current = requestAnimationFrame(fade);
  };
  return play;
}
