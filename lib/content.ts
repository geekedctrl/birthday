import { birthdayConfig } from "@/content/config";
import { timeline } from "@/content/timeline";
import { memories } from "@/content/memories";
import { reasons } from "@/content/reasons";
import { letter } from "@/content/letter";
import { gift } from "@/content/gift";

export const defaultContent = { birthdayConfig, timeline, memories, reasons, letter, gift };
export type ExperienceContent = typeof defaultContent;
export let liveContent: ExperienceContent = defaultContent;

export function setLiveContent(content: ExperienceContent) {
  liveContent = content;
}
