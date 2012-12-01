function displayString(str) {
  console.log(str);
  $("#output_bpm").stop().fadeOut(0).html(str).fadeIn(100);
}

function hack(pattern, b, c) {
  //console.log("Hack-b-c");
  var i = 0;
  while(i < pattern.length) {
    if(isNumber(pattern[i])) {
      p = parseFloat(pattern[i]);
      c(p);
    } else if(pattern[i] === "[") {
      p3 = pattern[i + 3];
      if(p3 !== "]") {
        console.log("WARNING: Pattern is irregular. No closing ] at position " + i + 3);
      }
      p1 = parseFloat(pattern[i + 1]);
      p2 = parseFloat(pattern[i + 2]);
      b(p1, p2);
      i += 3;
    } else {
      console.log("WARNING: Pattern is irregular. No closing ] at position " + i);
    }
    i += 1;
  }
}

// From http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric


function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function beatsPerBar(pattern) {
  max_beat_index = 0;

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


function hackData(audioData, audio_analysis) {
  try {
    console.log("Datafying-hack data.");

    pattern = document.getElementById("beat_pattern").value;
    beats_per_bar = beatsPerBar(pattern);

    hack_data = [];

    var beat_type = (document.getElementById("beat_type_tatums").checked ? "tatums" : "beats");
    beats = audio_analysis[beat_type];

    function idx(i, j) {
      return beats[i * beats_per_bar + j]["start"];
    }

    num_samples = 0;

    function samplesBetweenTimes(t1, t2) {
      // We must compute these separately, then subtract.
      // Else, we mgith risk rounding error.
      var sampleStart = Math.floor(t1 * audioData.sampleRate);
      var sampleEnd = Math.floor(t2 * audioData.sampleRate);
      return sampleEnd - sampleStart;
    }

    function copy_beat(i, j) {
      //console.log("copy_beat");
      hack_data.push({
        "kind": "copy",
        "segment": {
          "start": idx(i, j - 1),
          "end": idx(i, j)
        }
      });
      // Mimic hacking computation.
      num_samples += samplesBetweenTimes(idx(i, j - 1), idx(i, j));
    }

    function blend_beats(i, j, k) {
      //console.log("blend_beats");
      hack_data.push({
        "kind": "blend",
        "segment1": {
          "start": idx(i, j - 1),
          "end": idx(i, j)
        },
        "segment2": {
          "start": idx(i, k - 1),
          "end": idx(i, k)
        }
      });
      num_samples += Math.max(
      samplesBetweenTimes(idx(i, j - 1), idx(i, j)), samplesBetweenTimes(idx(i, k - 1), idx(i, k)))
    }

    // Everything up to the first beat
    hack_data.push({
      "kind": "copy",
      "segment": {
        "start": 0,
        "end": idx(0, 0)
      }
    });
    num_samples += samplesBetweenTimes(0, idx(0, 0));

    console.log("Go bars!");
    num_bars = Math.floor((beats.length - 1) / beats_per_bar);
    console.log(num_bars);
    for(var i = 0; i < num_bars; i++) {
      //console.log("Bar #" + i);


      function b(j, k) {
        return blend_beats(i, j, k)
      };

      function c(j) {
        return copy_beat(i, j)
      };
      hack(pattern, b, c);
    }
    console.log("Done bars!");

    // Add everything from the final bar onwards.
    hack_data.push({
      "kind": "copy",
      "segment": {
        "start": idx(num_bars, 0),
        "end": audioData.duration
      }
    })
    num_samples += samplesBetweenTimes(idx(num_bars, 0), audioData.duration);

  } catch(e) {
    console.log(e);
  }


  overlap = document.getElementById("overlap").value / 100;
  return {
    "overlap": overlap,
    "num_samples": num_samples,
    "segments": hack_data
  };
}

var aa;

function callback(audio_analysis) {

  aa = audio_analysis;
  $("#output_text").attr("value", JSON.stringify(audio_analysis, null, 2)).fadeOut(0).fadeIn(400);
  displayString("BPM of \"" + audio_analysis.meta.title + "\" is: " + audio_analysis.track.tempo + "<br>(confidence: " + Math.round(100 * audio_analysis.track.tempo_confidence) + "%)");
  displayString("Please wait a moment for waltzification.");

  var reader = new FileReader();

  reader.onload = function(fileEvent) {
    console.log("xFileOnload");
    d = fileEvent.target.result;
    goData(d);
  };

  reader.readAsArrayBuffer(xFile);
  console.log("go-go buffer");

}


var context = new webkitAudioContext();
var context2 = new webkitAudioContext();
var analyser = context.createAnalyser();
var xFile;
var ev;
var w;
var d;
var src;
var buf;
var blob;
var blob2
var hack_data;

function saveFile() {
  var fileName = aa.meta.title;
  if(fileName === "") {
    fileName = "Song";
  }
  var extension = ".wav";
  saveAs(blob, fileName + extension);
}

function goData(data) {
  console.log("goData()");
  context.decodeAudioData(data, function(buffer) {

    buf = buffer;

    console.log("decoding1.0");
    hack_data = hackData(buffer, aa);

    console.log("decoding1.1");
    w = Wav.createWaveFileData(buffer, hack_data);

    //source = context2.createBufferSource();
    //src = source;
    //buffer = context2.createBuffer(w.buffer, false);
    //source.buffer = buffer;
    //source.connect(context2.destination);
    //source.noteOn(0);
    console.log("Done");
    displayString("Hacked version of \"" + aa.meta.title + "\" is playing.");
    document.getElementById("download_button_div").classList.remove("hidden");
    document.getElementById("download_button").addEventListener("click", saveFile);
    blob = new Blob([w]);

    url = webkitURL.createObjectURL(blob);
    document.getElementById("output_audio").src = url;
    document.getElementById("output_audio").play();

  }, function(e) {
    displayString("Failed to decode audio file (unknown reason). :-(");
    console.log(e);
  });

}

var echonest; // For easier console debugging.


function go(file) {
  xFile = file;
  try {
    echonest = echonestAnalysis(file);
    echonest.setProgressCallback(displayString);
    echonest.go(callback);
  } catch(e) {
    console.log(e);
  }
}

function rehack() {
  xFile && go(xFile);
}

$(document).ready(function() {
  document.getElementById("rehack_button").addEventListener("click", rehack);
});