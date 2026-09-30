const key = "birthday-experience-progress";

export type Progress = { scene: number; cakeCompleted: boolean; muted: boolean };

export const defaultProgress: Progress = { scene: 0, cakeCompleted: false, muted: false };

export function readProgress(): Progress {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export function writeProgress(progress: Progress) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(progress));
}
