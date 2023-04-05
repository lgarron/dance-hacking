var beatcaster = (function() {

  function log(str) {
    console.log("[Beatcaster] " + str);
  }

  function hack(pattern, blend, copy) {
    //log("Hack-b-c");
    var i = 0;
    while(i < pattern.length) {
      if(isNumber(pattern[i])) {
        var p = parseFloat(pattern[i]);
        copy(p);
      } else if(pattern[i] === "[") {
        var p3 = pattern[i + 3];
        if(p3 !== "]") {
          log("WARNING: Pattern is irregular. No closing ] at position " + i + 3);
        }
        var p1 = parseFloat(pattern[i + 1]);
        var p2 = parseFloat(pattern[i + 2]);
        blend(p1, p2);
        i += 3;
      } else {
        log("WARNING: Pattern is irregular. Unexpected character at position " + i);
      }
      i += 1;
    }
  }

  // From http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function beatsPerBar(pattern) {
    var max_beat_index = 0;

    function update_max_beat_index(i) {
      if(i > max_beat_index) {
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


  function hackData(audioData, audio_analysis, pattern, overlap, tatumsQ) {
    try {
      current_hack.downloadFileName = current_hack.file.name + " (" + document.getElementById("beat_pattern").value + " pattern, " + document.getElementById("overlap").value + "% overlap)";
      //log("Datafying-hack data.");
      beats_per_bar = beatsPerBar(pattern);

      var hack_data = [];

      var beat_type = (tatumsQ ? "tatums" : "beats");
      var beats = audio_analysis;

      // Number of samples in the hacked song.
      var num_samples = 0;

      // Returns the j-th beat of the i-th bar (0-indexed).
      function beat_start(i, j) {
        return beats[i * beats_per_bar + j][0];
      }

      function samplesBetweenTimes(t1, t2) {
        // We must compute these separately, then subtract.
        // Else, we might risk rounding error.
        var sampleStart = Math.floor(t1 * audioData.sampleRate);
        var sampleEnd = Math.floor(t2 * audioData.sampleRate);
        return sampleEnd - sampleStart;
      }

      function hack_data_copy(timeStart, timeEnd) {
        hack_data.push({
          "kind": "copy",
          "segment": {
            "start": timeStart,
            "end": timeEnd
          }
        });
        // Mimic hacking computation.
        num_samples += samplesBetweenTimes(timeStart, timeEnd);
      }

      function copy_beat(i, j) {
        //log("copy_beat");
        hack_data_copy(beat_start(i, j - 1), beat_start(i, j))
      }

      function blend_beats(i, j, k) {
        //log("blend_beats");
        hack_data.push({
          "kind": "blend",
          "segment1": {
            "start": beat_start(i, j - 1),
            "end": beat_start(i, j)
          },
          "segment2": {
            "start": beat_start(i, k - 1),
            "end": beat_start(i, k)
          }
        });
        num_samples += Math.max(
          samplesBetweenTimes(beat_start(i, j - 1), beat_start(i, j)),
          samplesBetweenTimes(beat_start(i, k - 1), beat_start(i, k))
        );
      }

      // Everything up to the first beat
      hack_data_copy(0, beat_start(0, 0));

      var num_bars = Math.floor((beats.length - 1) / beats_per_bar);
      log("Generating hack data for " + num_bars + " bars!");
      for(var i = 0; i < num_bars; i++) {
        //log("Bar #" + i);

        // Curry the bar index.
        function blend(j, k) {
          return blend_beats(i, j, k)
        };

        function copy(j) {
          return copy_beat(i, j)
        };
        hack(pattern, blend, copy);
      }

      // Add everything from the final bar onwards.
      hack_data_copy(beat_start(num_bars, 0), audioData.duration);

      log("Done generating hack data!");

    } catch(e) {
      log(e);
    }

    return {
      "overlap": overlap,
      "num_samples": num_samples,
      "segments": hack_data
    };
  }

  return {
    hackData: hackData
  }
})();
