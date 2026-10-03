const recordingTypes = [
  "audio/mp4;codecs=mp4a.40.2", "audio/mp4",
  "audio/webm;codecs=opus", "audio/webm",
  "audio/ogg;codecs=opus", "audio/ogg"
];

export function selectVoiceType(canRecord: (type: string) => boolean, canPlay: (type: string) => string) {
  return recordingTypes.find(type => canRecord(type) && Boolean(canPlay(type)));
}
