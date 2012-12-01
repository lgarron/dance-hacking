"use strict";

var current_hack = {
  hack_data: null,
  audio_analysis: null,
  blob: null,
  xFile: null
};
var debug_data = {
  buffer: null,
  d: null,
  w: null
}

function callback(audio_analysis) {

  current_hack.audio_analysis = audio_analysis;
  $("#output_text").attr("value", JSON.stringify(audio_analysis, null, 2)).fadeOut(0).fadeIn(400);
  displayString("BPM of \"" + audio_analysis.meta.title + "\" is: " + audio_analysis.track.tempo + "<br>(confidence: " + Math.round(100 * audio_analysis.track.tempo_confidence) + "%)");
  displayString("Please wait a moment for waltzification.");

  var reader = new FileReader();

  reader.onload = function(fileEvent) {
    console.log("xFileOnload");
     var d = fileEvent.target.result;
     debug_data.d = d;
    goData(d);
  };

  reader.readAsArrayBuffer(current_hack.xFile);
  console.log("go-go buffer");

}



function saveFile() {
  var fileName = current_hack.audio_analysis.meta.title;
  if(fileName === "") {
    fileName = "Song";
  }
  var extension = ".wav";
  saveAs(current_hack.blob, fileName + extension);
}

function displayString(str) {
  console.log(str);
  $("#output_bpm").stop().fadeOut(0).html(str).fadeIn(100);
}
function goData(data) {
  console.log("goData()");

  var context = new webkitAudioContext();
  context.decodeAudioData(data, function(buffer) {

    debug_data.buffer = buffer;

    console.log("decoding1.0");
    current_hack.hack_data = beatcaster.hackData(
      buffer,
      current_hack.audio_analysis,
      document.getElementById("beat_pattern").value,
      document.getElementById("overlap").value / 100,
      document.getElementById("beat_type_tatums").checked
    );

    console.log("decoding1.1");
    var w = Wav.createWaveFileData(buffer, current_hack.hack_data);
    debug_data.w = w;

    console.log("Done");
    displayString("Hacked version of \"" + current_hack.audio_analysis.meta.title + "\" is playing.");
    document.getElementById("download_button_div").classList.remove("hidden");
    document.getElementById("download_button").addEventListener("click", saveFile);
    current_hack.blob = new Blob([w]);

    var url = webkitURL.createObjectURL(current_hack.blob);
    document.getElementById("output_audio").src = url;
    document.getElementById("output_audio").play();

  }, function(e) {
    displayString("Failed to decode audio file (unknown reason). :-(");
    console.log(e);
  });

}

var echonest; // For easier console debugging.


function go(file) {
  current_hack.xFile = file;
  try {
    echonest = echonestAnalysis(file);
    echonest.setProgressCallback(displayString);
    echonest.go(callback);
  } catch(e) {
    console.log(e);
  }
}

function rehack() {
  current_hack.xFile && go(current_hack.xFile);
}

$(document).ready(function() {
  registerFileDragDrop(document.body, document.getElementById("new_song"), go);
  document.getElementById("rehack_button").addEventListener("click", rehack);
});