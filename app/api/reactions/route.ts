import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { notifyReactionReceived } from "@/lib/notifications";

type Reaction = { id: string; emoji?: string; text?: string; audioPath?: string; createdAt: string };
const filePath = path.join(process.cwd(), "data", "reactions.json");

async function readReactions(): Promise<Reaction[]> {
  try { return JSON.parse(await fs.readFile(filePath, "utf8")) as Reaction[]; }
  catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function GET(request: Request) {
  if (request.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readReactions());
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const form = contentType.includes("multipart/form-data") ? await request.formData() : null;
  const body = form ? null : await request.json() as { emoji?: unknown; text?: unknown };
  const emojiValue = form?.get("emoji") ?? body?.emoji;
  const textValue = form?.get("text") ?? body?.text;
  const emoji = typeof emojiValue === "string" ? emojiValue.slice(0, 8) : "";
  const text = typeof textValue === "string" ? textValue.trim().slice(0, 1000) : "";
  const voice = form?.get("voice");
  if (voice instanceof File && (voice.size === 0 || voice.size > 5_000_000 || !voice.type.startsWith("audio/"))) {
    return NextResponse.json({ error: "Please send a non-empty audio recording up to 5 MB." }, { status: 400 });
  }
  if (!emoji && !text && !(voice instanceof File)) return NextResponse.json({ error: "A reaction is required." }, { status: 400 });
  const reactions = await readReactions();
  const id = crypto.randomUUID();
  let audioPath: string | undefined;
  if (voice instanceof File && voice.size <= 5_000_000 && voice.type.startsWith("audio/")) {
    const audioDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(audioDir, { recursive: true });
    audioPath = path.join("uploads", `${id}.webm`);
    await fs.writeFile(path.join(process.cwd(), audioPath), Buffer.from(await voice.arrayBuffer()));
  }
  const reaction: Reaction = { id, emoji, text, audioPath, createdAt: new Date().toISOString() };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify([reaction, ...reactions].slice(0, 500), null, 2), "utf8");
  await notifyReactionReceived({ hasAudio: Boolean(audioPath), text });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (request.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { id?: unknown };
  const reactions = (await readReactions()).filter((reaction) => reaction.id !== body.id);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(reactions, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}
