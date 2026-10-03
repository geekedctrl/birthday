export const birthdayConfig = {
  girlfriend: { name: "Subaasini", nickname: "[NICKNAME]" },
  birthday: { date: "[BIRTHDAY_DATE_ISO]", timezone: "Asia/Kuala_Lumpur" },
  opening: {
    introLine: "I made something for you.",
    promptLine: "One small thing first.",
    cinemaTitle: "Happy Birthday, Subaasini",
    cinemaSubtitle: "A little secret place, made just for you."
  },
  finalMessage: "I weave you da kuttyma",
  music: { intro: "", timeline: "", constellation: "", vinyl: "", finale: "" },
  media: {
    finalPhoto: "/photos/Lovingg.png",
    faceMe: "/faces/face-me.png",
    faceHer: "/faces/face-her.png"
  }
} as const;

export type BirthdayConfig = typeof birthdayConfig;
