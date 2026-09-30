/** Server-side notification with message text; never include audio or admin credentials. */
export async function notifyReactionReceived({ hasAudio, text }: { hasAudio: boolean; text: string }) {
  const topicUrl = process.env.NTFY_TOPIC_URL ?? "https://ntfy.sh/suba";
  if (!topicUrl.trim()) return;
  const hasText = Boolean(text);
  const kind = hasAudio && hasText ? "audio and text message" : hasAudio ? "audio message" : hasText ? "text message" : "emoji reaction";

  try {
    const response = await fetch(topicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Title: `New birthday ${kind}`,
        Tags: hasAudio ? "microphone,heart" : "speech_balloon,heart"
      },
      body: [`You received a new ${kind} on your birthday website.`, text, "Open /admin/reactions on your website to view or listen."].filter(Boolean).join("\n\n"),
      signal: AbortSignal.timeout(5000),
      cache: "no-store"
    });
    if (!response.ok) {
      console.error(`Reaction saved, but ntfy notification failed (HTTP ${response.status}).`);
    }
    await response.body?.cancel();
  } catch {
    // An unavailable notification service must not fail an already saved reaction.
    console.error("Reaction saved, but ntfy could not be reached within the notification timeout.");
  }
}
