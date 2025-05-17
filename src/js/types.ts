export type SongBeatData = [number][];

export interface StoredSongData {
  fileName: string;
  beats: SongBeatData;
  formatVersion: number;
}

export type Milliseconds = number;

export interface HackSpecSegment {
  start: number;
  end: number;
}

export interface HackSpecBeatCopy {
  kind: "copy";
  segment: HackSpecSegment;
}

export interface HackSpecBeatBlend {
  kind: "blend";
  segment1: HackSpecSegment;
  segment2: HackSpecSegment;
}

export type HackSpecBeat = HackSpecBeatCopy | HackSpecBeatBlend;

export interface HackData {
  overlap: number;
  num_samples: number;
  segments: HackSpecBeat[];
}

export type HackPatternString = string;
