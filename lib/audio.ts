let context: AudioContext | null = null;

export async function initialiseAudio() {
  if (typeof window === "undefined") return;
  context ??= new AudioContext();
  if (context.state === "suspended") await context.resume();
}

export function playTone(frequency = 440, duration = 0.18) {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}
