import { current_hack } from "./current_hack.js";

function log(str) {
  console.log(`[Beatcaster] ${str}`);
}

function hack(pattern, blend, copy) {
  //log("Hack-b-c");
  let i = 0;
  while (i < pattern.length) {
    if (
      isNumber(pattern[i]) ||
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".includes(
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

// From http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric

function isNumber(n) {
  return !isNaN(parseInt(n)) && isFinite(n);
}

function beatsPerBar(pattern) {
  let max_beat_index = 0;

  function update_max_beat_index(i) {
    if (i > max_beat_index) {
      max_beat_index = i;
    }
  }

  function update_max_beat_index_b(j, k) {
    update_max_beat_index(j);
    update_max_beat_index(k);
  }

  function update_max_beat_index_c(j) {
    update_max_beat_index(j);
  }

  hack(pattern, update_max_beat_index_b, update_max_beat_index_c);

  return max_beat_index;
}

type HackDataEntry =
  | {
      kind: "copy";
      segment: {
        start: number;
        end: number;
      };
    }
  | {
      kind: "blend";
      segment1: {
        start: number;
        end: number;
      };
      segment2: {
        start: number;
        end: number;
      };
    };

export function hackData(audioData, audio_analysis, pattern, overlap, tatumsQ) {
  console.log({ pattern });
  // Number of samples in the hacked song.
  let num_samples = 0;
  const hack_data: HackDataEntry[] = [];
  try {
    current_hack.downloadFileName = `${current_hack.file.name} (${
      (document.getElementById("beat_pattern") as HTMLInputElement).value
    } pattern, ${
      (document.getElementById("overlap") as HTMLInputElement).value
    }% overlap)`;
    //log("Datafying-hack data.");
    const beats_per_bar = beatsPerBar(pattern);

    const beat_type = tatumsQ ? "tatums" : "beats";
    const beats = audio_analysis;

    // Returns the j-th beat of the i-th bar (0-indexed).
    function beat_start(i, j) {
      return beats[i * beats_per_bar + j][0];
    }

    function samplesBetweenTimes(t1, t2) {
      // We must compute these separately, then subtract.
      // Else, we might risk rounding error.
      const sampleStart = Math.floor(t1 * audioData.sampleRate);
      const sampleEnd = Math.floor(t2 * audioData.sampleRate);
      return sampleEnd - sampleStart;
    }

    function hack_data_copy(timeStart, timeEnd) {
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

    function copy_beat(i, j) {
      //log("copy_beat");
      hack_data_copy(beat_start(i, j - 1), beat_start(i, j));
    }

    function blend_beats(i, j, k) {
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
      function blend(j, k) {
        return blend_beats(i, j, k);
      }

      function copy(j) {
        return copy_beat(i, j);
      }
      hack(pattern, blend, copy);
    }

    // Add everything from the final bar onwards.
    hack_data_copy(beat_start(num_bars, 0), audioData.duration);

    log("Done generating hack data!");
  } catch (e) {
    log(e);
  }

  return {
    overlap: overlap,
    num_samples: num_samples,
    segments: hack_data,
  };
}
