import { current_hack } from "./current_hack.js";
import type {
  HackData,
  HackPatternString,
  HackSpecBeat,
  Milliseconds,
  SongBeatData,
} from "./types.js";

function log(str: string) {
  console.log(`[Beatcaster] ${str}`);
}

function hack(
  pattern: HackPatternString,
  blend: (p1: number, p2: number) => void,
  copy: (p: number) => void,
) {
  //log("Hack-b-c");
  let i = 0;
  while (i < pattern.length) {
    if (
      "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".includes(
        pattern[i],
      )
    ) {
      const p = parseInt(pattern[i]) || parseInt(pattern[i], 26) - 9;
      copy(p);
    } else if (pattern[i] === "[") {
      const p3 = pattern[i + 3];
      if (p3 !== "]") {
        log(`WARNING: Pattern is irregular. No closing ] at position ${i}${3}`);
      }
      const p1 = parseInt(pattern[i + 1]) || parseInt(pattern[i + 1], 26) - 9;
      const p2 = parseInt(pattern[i + 2]) || parseInt(pattern[i + 2], 26) - 9;
      blend(p1, p2);
      i += 3;
    } else {
      log(
        `WARNING: Pattern is irregular. Unexpected character at position ${i}`,
      );
    }
    i += 1;
  }
}

function beatsPerBar(pattern: HackPatternString) {
  let max_beat_index = 0;

  function update_max_beat_index(i: number) {
    if (i > max_beat_index) {
      max_beat_index = i;
    }
  }

  function update_max_beat_index_b(j: number, k: number) {
    update_max_beat_index(j);
    update_max_beat_index(k);
  }

  function update_max_beat_index_c(j: number) {
    update_max_beat_index(j);
  }

  hack(pattern, update_max_beat_index_b, update_max_beat_index_c);

  return max_beat_index;
}

export function hackData(
  audioData: AudioBuffer,
  audio_analysis: SongBeatData,
  pattern: HackPatternString,
  overlap: number,
): HackData {
  console.log({ pattern });
  // Number of samples in the hacked song.
  let num_samples = 0;
  const hack_data: HackSpecBeat[] = [];
  try {
    current_hack.downloadFileName = `${current_hack.file!.name} (${
      (document.getElementById("beat_pattern") as HTMLInputElement).value
    } pattern, ${
      (document.getElementById("overlap") as HTMLInputElement).value
    }% overlap)`;
    //log("Datafying-hack data.");
    const beats_per_bar = beatsPerBar(pattern);

    const beats = audio_analysis;

    // Returns the j-th beat of the i-th bar (0-indexed).
    function beat_start(i: number, j: number) {
      return beats[i * beats_per_bar + j][0];
    }

    function samplesBetweenTimes(t1: number, t2: number) {
      // We must compute these separately, then subtract.
      // Else, we might risk rounding error.
      const sampleStart = Math.floor(t1 * audioData.sampleRate);
      const sampleEnd = Math.floor(t2 * audioData.sampleRate);
      return sampleEnd - sampleStart;
    }

    function hack_data_copy(timeStart: Milliseconds, timeEnd: Milliseconds) {
      hack_data.push({
        kind: "copy",
        segment: {
          start: timeStart,
          end: timeEnd,
        },
      });
      // Mimic hacking computation.
      num_samples += samplesBetweenTimes(timeStart, timeEnd);
    }

    function copy_beat(i: number, j: number) {
      //log("copy_beat");
      hack_data_copy(beat_start(i, j - 1), beat_start(i, j));
    }

    function blend_beats(i: number, j: number, k: number) {
      //log("blend_beats");
      hack_data.push({
        kind: "blend",
        segment1: {
          start: beat_start(i, j - 1),
          end: beat_start(i, j),
        },
        segment2: {
          start: beat_start(i, k - 1),
          end: beat_start(i, k),
        },
      });
      num_samples += Math.max(
        samplesBetweenTimes(beat_start(i, j - 1), beat_start(i, j)),
        samplesBetweenTimes(beat_start(i, k - 1), beat_start(i, k)),
      );
    }

    // Everything up to the first beat
    hack_data_copy(0, beat_start(0, 0));

    const num_bars = Math.floor((beats.length - 1) / beats_per_bar);
    const newLocal = `Generating hack data for ${num_bars} bars!`;
    log(newLocal);
    for (let i = 0; i < num_bars; i++) {
      //log("Bar #" + i);

      // Curry the bar index.
      function blend(j: number, k: number) {
        return blend_beats(i, j, k);
      }

      function copy(j: number) {
        return copy_beat(i, j);
      }
      hack(pattern, blend, copy);
    }

    // Add everything from the final bar onwards.
    hack_data_copy(beat_start(num_bars, 0), audioData.duration);

    log("Done generating hack data!");
  } catch (e) {
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript makes it a bit gnarly
    log(e as any);
  }

  return {
    overlap: overlap,
    num_samples: num_samples,
    segments: hack_data,
  };
}
