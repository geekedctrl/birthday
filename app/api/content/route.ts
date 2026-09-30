import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { defaultContent } from "@/lib/content";

const filePath = path.join(process.cwd(), "data", "content.json");
export const dynamic = "force-dynamic";

async function readContent() {
  try {
    const saved = JSON.parse(await fs.readFile(filePath, "utf8"));
    return {
      ...defaultContent,
      ...saved,
      timeline: Array.isArray(saved.timeline) && saved.timeline.length >= 10 ? saved.timeline : [...(saved.timeline ?? []), ...defaultContent.timeline].slice(0, 10),
      memories: Array.isArray(saved.memories) && saved.memories.length > 0 ? saved.memories : defaultContent.memories
    };
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaultContent;
    throw error;
  }
}

function authorized(request: Request) {
  return request.headers.get("x-admin-token") === process.env.ADMIN_TOKEN;
}

function normalizeMediaPath(value: unknown) {
  if (typeof value !== "string") return "";
  return value.startsWith("public/") ? `/${value.slice("public/".length)}` : value;
}

export async function GET() {
  const content = await readContent();
  content.timeline = content.timeline.map((item: (typeof defaultContent.timeline)[number]) => ({ ...item, photo: normalizeMediaPath(item.photo) || null }));
  content.memories = content.memories.map((item: (typeof defaultContent.memories)[number]) => ({ ...item, photo: normalizeMediaPath(item.photo) || null }));
  content.birthdayConfig.music.vinyl = normalizeMediaPath(content.birthdayConfig.music.vinyl);
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const incoming = await request.json() as Partial<typeof defaultContent>;
  const content = { ...defaultContent, ...incoming };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(content, null, 2), "utf8");
  return NextResponse.json(content);
}
