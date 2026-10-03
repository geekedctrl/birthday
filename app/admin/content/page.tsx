"use client";

import { useEffect, useState } from "react";
import ImageField from "@/components/ImageCropField";

type EditorState = {
  name: string;
  nickname: string;
  birthdayDate: string;
  introLine: string;
  promptLine: string;
  cinemaTitle: string;
  cinemaSubtitle: string;
  finalMessage: string;
  musicIntro: string;
  musicTimeline: string;
  musicConstellation: string;
  musicVinyl: string;
  musicFinale: string;
  finalPhoto: string;
  timeline: string;
  memories: string;
  reasons: string;
  salutation: string;
  paragraphs: string;
  signature: string;
  giftTitle: string;
  giftDescription: string;
  giftImage: string;
};

type Memory = { id: string; title: string; caption: string; photo: string };
type TimelineEntry = {
  date: string;
  title: string;
  description: string;
  photo: string;
};

const empty: EditorState = {
  name: "",
  nickname: "",
  birthdayDate: "",
  introLine: "",
  promptLine: "",
  cinemaTitle: "",
  cinemaSubtitle: "",
  finalMessage: "",
  musicIntro: "",
  musicTimeline: "",
  musicConstellation: "",
  musicVinyl: "",
  musicFinale: "",
  finalPhoto: "",
  timeline: "[]",
  memories: "[]",
  reasons: "",
  salutation: "",
  paragraphs: "",
  signature: "",
  giftTitle: "",
  giftDescription: "",
  giftImage: "",
};

function Field({
  label,
  value,
  onChange,
  area = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  area?: boolean;
  hint?: string;
}) {
  const control = area ? (
    <textarea
      rows={4}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ) : (
    <input value={value} onChange={(event) => onChange(event.target.value)} />
  );
  return (
    <label>
      <span>{label}</span>
      {control}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function ContentAdminPage() {
  const [token, setToken] = useState("");
  const [form, setForm] = useState(empty);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [status, setStatus] = useState("");
  const set = (key: keyof EditorState) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    const saved = window.sessionStorage.getItem("admin-token");
    if (saved) setToken(saved);
  }, []);
  const load = async () => {
    const response = await fetch("/api/content");
    const content = await response.json();
    setTimelineEntries(
      content.timeline.map((entry: Partial<TimelineEntry>) => ({
        date: entry.date || "",
        title: entry.title || "",
        description: entry.description || "",
        photo: entry.photo || "",
      })),
    );
    setMemories(
      content.memories.map((memory: Partial<Memory>, index: number) => ({
        id: memory.id || `memory-${index + 1}`,
        title: memory.title || "",
        caption: memory.caption || "",
        photo: memory.photo || "",
      })),
    );
    setForm({
      name: content.birthdayConfig.girlfriend.name,
      nickname: content.birthdayConfig.girlfriend.nickname,
      birthdayDate: content.birthdayConfig.birthday.date,
      introLine: content.birthdayConfig.opening.introLine,
      promptLine: content.birthdayConfig.opening.promptLine,
      cinemaTitle: content.birthdayConfig.opening.cinemaTitle,
      cinemaSubtitle: content.birthdayConfig.opening.cinemaSubtitle,
      finalMessage: content.birthdayConfig.finalMessage,
      musicIntro: content.birthdayConfig.music?.intro ?? "",
      musicTimeline: content.birthdayConfig.music?.timeline ?? "",
      musicConstellation: content.birthdayConfig.music?.constellation ?? "",
      musicVinyl: content.birthdayConfig.music?.vinyl ?? "",
      musicFinale: content.birthdayConfig.music?.finale ?? "",
      finalPhoto: content.birthdayConfig.media.finalPhoto,
      timeline: "",
      memories: "",
      reasons: content.reasons.join("\n"),
      salutation: content.letter.salutation,
      paragraphs: content.letter.paragraphs.join("\n\n"),
      signature: content.letter.signature,
      giftTitle: content.gift.title,
      giftDescription: content.gift.description,
      giftImage: content.gift.image ?? "",
    });
  };
  useEffect(() => {
    load().catch(() => setStatus("Could not load current content."));
  }, []);
  const save = async () => {
    try {
      if (timelineEntries.length === 0 || memories.length === 0)
        throw new Error("Memories required");
      const timeline = timelineEntries;
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          birthdayConfig: {
            girlfriend: { name: form.name, nickname: form.nickname },
            birthday: {
              date: form.birthdayDate,
              timezone: "Asia/Kuala_Lumpur",
            },
            opening: {
              introLine: form.introLine,
              promptLine: form.promptLine,
              cinemaTitle: form.cinemaTitle,
              cinemaSubtitle: form.cinemaSubtitle,
            },
            finalMessage: form.finalMessage,
            music: {
              intro: form.musicIntro,
              timeline: form.musicTimeline,
              constellation: form.musicConstellation,
              vinyl: form.musicVinyl,
              finale: form.musicFinale,
            },
            media: {
              finalPhoto: form.finalPhoto,
              faceMe: "/faces/face-me.png",
              faceHer: "/faces/face-her.png",
            },
          },
          timeline,
          memories,
          reasons: form.reasons
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          letter: {
            salutation: form.salutation,
            paragraphs: form.paragraphs.split(/\n\s*\n/).filter(Boolean),
            signature: form.signature,
          },
          gift: {
            type: "message",
            title: form.giftTitle,
            description: form.giftDescription,
            image: form.giftImage || null,
          },
        }),
      });
      if (!response.ok) {
        if (response.status === 401)
          throw new Error(
            "Your admin token was rejected. Enter the value from .env.local and try again.",
          );
        throw new Error(`Could not save content (HTTP ${response.status}).`);
      }
      window.sessionStorage.setItem("admin-token", token);
      setStatus("Saved. Refresh the experience to see your changes.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not save content.",
      );
    }
  };
  const resetExamples = () => {
    setTimelineEntries(
      Array.from({ length: 10 }, (_, index) => ({
        date: "",
        title: `Chapter memory ${index + 1}`,
        description: "",
        photo: "",
      })),
    );
    setMemories(
      Array.from({ length: 5 }, (_, index) => ({
        id: `memory-${index + 1}`,
        title: `Cinema memory ${index + 1}`,
        caption: "",
        photo: "",
      })),
    );
  };
  const updateTimeline = (
    index: number,
    key: keyof TimelineEntry,
    value: string,
  ) =>
    setTimelineEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry,
      ),
    );
  const addTimeline = () =>
    setTimelineEntries((current) => [
      ...current,
      { date: "", title: "", description: "", photo: "" },
    ]);
  const removeTimeline = (index: number) =>
    setTimelineEntries((current) =>
      current.filter((_, entryIndex) => entryIndex !== index),
    );
  const updateMemory = (index: number, key: keyof Memory, value: string) =>
    setMemories((current) =>
      current.map((memory, memoryIndex) =>
        memoryIndex === index ? { ...memory, [key]: value } : memory,
      ),
    );
  const addMemory = () =>
    setMemories((current) => [
      ...current,
      { id: `memory-${Date.now()}`, title: "", caption: "", photo: "" },
    ]);
  const removeMemory = (index: number) =>
    setMemories((current) =>
      current.filter((_, memoryIndex) => memoryIndex !== index),
    );
  return (
    <main className="editor-page">
      <div className="editor-wrap">
        <p className="eyebrow text-gold">PRIVATE CONTENT EDITOR</p>
        <h1 className="display">Make it yours.</h1>
        <p className="editor-intro">
          Edit words, memories, images, and music paths here. Nothing is sent to
          a third party.
        </p>
        <div className="media-guide">
          <strong>Where to put your files</strong>
          <span>
            Photos: <code>public/photos</code> →{" "}
            <code>/photos/filename.webp</code>
          </span>
          <span>
            Videos: <code>public/videos</code> →{" "}
            <code>/videos/filename.mp4</code>
          </span>
          <span>
            Music: <code>public/audio</code> → <code>/audio/filename.mp3</code>
          </span>
          <span>
            Face images: <code>public/faces</code> →{" "}
            <code>/faces/filename.png</code>
          </span>
        </div>
        <div className="editor-auth">
          <input
            type="password"
            placeholder="ADMIN_TOKEN"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <button onClick={save}>Save all changes</button>
        </div>
        <section>
          <h2>Opening</h2>
          <div className="editor-grid">
            <Field label="Name" value={form.name} onChange={set("name")} />
            <Field
              label="Nickname"
              value={form.nickname}
              onChange={set("nickname")}
            />
            <Field
              label="Birthday date/time"
              hint="ISO format, e.g. 2026-10-04T00:00:00+08:00"
              value={form.birthdayDate}
              onChange={set("birthdayDate")}
            />
            <Field
              label="Intro line"
              value={form.introLine}
              onChange={set("introLine")}
            />
            <Field
              label="Intro prompt"
              value={form.promptLine}
              onChange={set("promptLine")}
            />
            <Field
              label="Cinema title"
              value={form.cinemaTitle}
              onChange={set("cinemaTitle")}
            />
            <Field
              label="Cinema subtitle"
              value={form.cinemaSubtitle}
              onChange={set("cinemaSubtitle")}
            />
            <Field
              label="Final message"
              area
              value={form.finalMessage}
              onChange={set("finalMessage")}
            />
          </div>
        </section>
        <section>
          <h2>Music and media</h2>
          <p className="editor-help">
            Use local paths such as <code>/audio/our-song.mp3</code>. Put files
            in <code>public/audio</code> and images in{" "}
            <code>public/photos</code>.
          </p>
          <div className="editor-grid">
            <Field
              label="Intro music"
              value={form.musicIntro}
              onChange={set("musicIntro")}
            />
            <Field
              label="Timeline music"
              value={form.musicTimeline}
              onChange={set("musicTimeline")}
            />
            <Field
              label="Constellation music"
              value={form.musicConstellation}
              onChange={set("musicConstellation")}
            />
            <Field
              label="Vinyl song"
              value={form.musicVinyl}
              onChange={set("musicVinyl")}
            />
            <Field
              label="Finale music"
              value={form.musicFinale}
              onChange={set("musicFinale")}
            />
            <ImageField
              label="Final photo"
              hint="Auto-fit is on. Use Crop photo to adjust the framing."
              value={form.finalPhoto}
              onChange={set("finalPhoto")}
            />
          </div>
        </section>
        <section>
          <div className="editor-section-heading">
            <div>
              <h2>Chapter One</h2>
              <p className="editor-help">
                These 10 entries appear in the Story timeline.
              </p>
            </div>
            <button className="editor-reset" onClick={resetExamples}>
              Reset examples
            </button>
          </div>
          <div className="memory-editor-list">
            {timelineEntries.map((entry, index) => (
              <article className="memory-editor-card" key={`chapter-${index}`}>
                <div className="memory-editor-card-heading">
                  <h3>Chapter memory {index + 1}</h3>
                  <button
                    className="editor-remove"
                    onClick={() => removeTimeline(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="editor-grid">
                  <Field
                    label="Date"
                    value={entry.date}
                    onChange={(value) => updateTimeline(index, "date", value)}
                  />
                  <Field
                    label="Title"
                    value={entry.title}
                    onChange={(value) => updateTimeline(index, "title", value)}
                  />
                  <ImageField
                    label="Photo"
                    hint="Auto-fit is on. Use Crop photo to adjust the framing."
                    ratio={16 / 9}
                    value={entry.photo}
                    onChange={(value) => updateTimeline(index, "photo", value)}
                  />
                </div>
                <Field
                  label="Description"
                  area
                  value={entry.description}
                  onChange={(value) =>
                    updateTimeline(index, "description", value)
                  }
                />
              </article>
            ))}
          </div>
          <button className="editor-add" onClick={addTimeline}>
            + Add Chapter One memory
          </button>
        </section>
        <section>
          <div className="editor-section-heading">
            <div>
              <h2>Memory Cinema</h2>
              <p className="editor-help">
                These entries appear in the Memory Cinema section.
              </p>
            </div>
          </div>
          <div className="memory-editor-list">
            {memories.map((memory, index) => (
              <article className="memory-editor-card" key={memory.id}>
                <div className="memory-editor-card-heading">
                  <h3>Cinema memory {index + 1}</h3>
                  <button
                    className="editor-remove"
                    onClick={() => removeMemory(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="editor-grid">
                  <Field
                    label="Title"
                    value={memory.title}
                    onChange={(value) => updateMemory(index, "title", value)}
                  />
                  <ImageField
                    label="Photo"
                    hint="Auto-fit is on. Use Crop photo to adjust the framing."
                    value={memory.photo}
                    onChange={(value) => updateMemory(index, "photo", value)}
                  />
                </div>
                <Field
                  label="Caption"
                  area
                  value={memory.caption}
                  onChange={(value) => updateMemory(index, "caption", value)}
                />
              </article>
            ))}
          </div>
          <button className="editor-add" onClick={addMemory}>
            + Add cinema memory
          </button>
        </section>
        <section>
          <h2>A jar of little truths</h2>
          <p className="editor-help">
            Add one reason or little truth per line. They appear one at a time
            when the jar is tapped.
          </p>
          <Field
            label="Little truths"
            hint="One truth per line"
            area
            value={form.reasons}
            onChange={set("reasons")}
          />
        </section>
        <section>
          <h2>Letter and gift</h2>
          <div className="editor-grid">
            <Field
              label="Letter salutation"
              value={form.salutation}
              onChange={set("salutation")}
            />
            <Field
              label="Signature"
              value={form.signature}
              onChange={set("signature")}
            />
            <Field
              label="Gift title"
              value={form.giftTitle}
              onChange={set("giftTitle")}
            />
            <ImageField
              label="Gift image"
              hint="Auto-fit is on. Use Crop photo to adjust the framing."
              value={form.giftImage}
              onChange={set("giftImage")}
            />
          </div>
          <Field
            label="Letter paragraphs"
            hint="Separate paragraphs with a blank line"
            area
            value={form.paragraphs}
            onChange={set("paragraphs")}
          />
          <Field
            label="Gift description"
            area
            value={form.giftDescription}
            onChange={set("giftDescription")}
          />
        </section>
        <button className="editor-save" onClick={save}>
          Save all changes
        </button>
        {status && <p className="editor-status">{status}</p>}
      </div>
    </main>
  );
}
