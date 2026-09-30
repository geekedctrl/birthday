# Birthday Experience

A private, self-hosted birthday experience built with Next.js, TypeScript, and Tailwind CSS.

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The birthday date is intentionally a placeholder in `content/config.ts`. Set it to an ISO timestamp with timezone information before production. During development, set `NEXT_PUBLIC_BYPASS_BIRTHDAY_GATE=true` in `.env.local`.
Set `NEXT_PUBLIC_SHOW_DEV_MENU=true` to show the scene-jump developer menu when running a production build locally. Keep it `false` for a public deployment.

## Personal content and media

- Replace placeholders in `content/config.ts`, `content/timeline.ts`, `content/memories.ts`, `content/reasons.ts`, `content/letter.ts`, and `content/gift.ts`.
- Put personal photos in `public/photos`, videos in `public/videos`, audio in `public/audio`, face crops in `public/faces`, and illustrations in `public/illustrations`.
- Keep private source media and `.env` files out of version control.

## Deployment

Create `.env`, then run `docker compose up -d --build`. The app is intentionally only exposed to the private Docker network so Cloudflare Tunnel can proxy to `http://birthday:3000` without router port forwarding. Persist `data/` and `uploads/` when backing up the installation.

The opening flow is implemented first; later scenes are designed to plug into the same scene system incrementally.

## Full experience flow

The app now includes the complete forward journey: gate, sound intro, cinema opening, cake, timeline, memory constellation, catch-the-heart mini-game, comic dance, reasons jar, vinyl player, memory cinema, letter, gift reveal, final scene, and private reaction capture.

Reactions are stored locally in `data/reactions.json` (the data directory is volume-mounted in Compose) and are only readable with the server-side `ADMIN_TOKEN`. Open `/admin/reactions` and enter that token to review or delete messages. Audio and personal media stay on the server; submitted message text is included in the ntfy notification described below.

After a reaction and any attached voice recording are saved, the server publishes a notification including any submitted text message to `https://ntfy.sh/suba`. Subscribe to the `suba` topic in your ntfy app. The notification includes the saved text with its line breaks, but no audio or admin token; view or listen on `/admin/reactions`. Text-only, audio-only, combined text and audio, and emoji-only submissions each trigger one notification identifying the submission type.

Override the destination with `NTFY_TOPIC_URL` in the server's `.env` (or `.env.local` for development). The default is `https://ntfy.sh/suba`; an explicitly empty value disables notifications. Notification requests time out after five seconds. If ntfy is unavailable or rejects a request, the saved reaction remains available and the server logs the notification failure; there is no automatic retry queue.

Open `/admin/content` to edit the birthday name, dates, copy, timeline, memories, reasons, letter, gift, image paths, and music paths through a form. The editor saves to `data/content.json`, so the changes survive container restarts when the `data/` volume is preserved. Use local asset paths such as `/audio/our-song.mp3` and `/photos/first-date.webp` (the app also corrects an accidental `public/audio/...` prefix when loading).

The content modules intentionally contain placeholders. Replace those values before sharing the URL. The UI supports local media paths under `public/photos`, `public/videos`, `public/audio`, `public/faces`, and `public/illustrations`. Each folder contains a short README with examples. In the editor, reference a file without `public`, for example a file stored at `public/photos/first-date.webp` should use `/photos/first-date.webp`.
