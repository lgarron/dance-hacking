import type { HackData, SongBeatData } from "./types";

export const current_hack: {
  hack_data?: HackData;
  audio_analysis?: SongBeatData;
  blob?: Blob;
  file?: File;
  downloadFileName?: string;
} = {};
