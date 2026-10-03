import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const filePath = path.join(process.cwd(), "uploads", `${params.id}.webm`);
  try {
    const reactions = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "reactions.json"), "utf8")) as { id: string; audioType?: string }[];
    const type = reactions.find(reaction => reaction.id === params.id)?.audioType || "audio/webm";
    const audio = await fs.readFile(filePath);
    return new NextResponse(audio, { headers: { "Content-Type": type, "Cache-Control": "private, no-store" } });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
