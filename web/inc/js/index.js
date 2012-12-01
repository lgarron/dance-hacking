"use strict";

var current_hack = {
  hack_data: null,
  audio_analysis: null,
  blob: null,
  file: null
};

function displayString(str) {
  console.log(str);
  $("#output_bpm").stop().fadeOut(0).html(str).fadeIn(100);
}

function saveFile() {
  var fileName = current_hack.audio_analysis.meta.title;
  if(fileName === "") {
    fileName = "Song";
  }
  var extension = ".wav";
  saveAs(current_hack.blob, fileName + extension);
}

function rehack() {
  current_hack.file && startHack(current_hack.file);
}

function hackSong(data) {

  var context = new webkitAudioContext();
  context.decodeAudioData(data, function(buffer) {

    current_hack.hack_data = beatcaster.hackData(
      buffer,
      current_hack.audio_analysis,
      document.getElementById("beat_pattern").value,
      document.getElementById("overlap").value / 100,
      document.getElementById("beat_type_tatums").checked
    );

    var w = Wav.createWaveFileData(buffer, current_hack.hack_data);
    current_hack.blob = new Blob([w]);
    var hackedSongBlobURL = webkitURL.createObjectURL(current_hack.blob);

    // Update UI

    document.getElementById("download_button_div").classList.remove("hidden");
    document.getElementById("download_button").addEventListener("click", saveFile);

    document.getElementById("output_audio").src = hackedSongBlobURL;
    document.getElementById("output_audio").play();
    displayString("Hacked version of \"" + current_hack.audio_analysis.meta.title + "\" is playing.");
    
    document.getElementById("rehack_button").addEventListener("click", rehack);

  }, function(e) {
    displayString("Failed to decode audio file (unknown reason). :-(");
    console.log(e);
  });

}

function processAnalysis(audio_analysis) {

  current_hack.audio_analysis = audio_analysis;
  $("#output_text").attr("value", JSON.stringify(audio_analysis, null, 2)).fadeOut(0).fadeIn(400);
  displayString("BPM of \"" + audio_analysis.meta.title + "\" is: " + audio_analysis.track.tempo + "<br>(confidence: " + Math.round(100 * audio_analysis.track.tempo_confidence) + "%)");
  displayString("Please wait a moment for waltzification.");

  var reader = new FileReader();

  reader.onload = function(fileEvent) {
    hackSong(fileEvent.target.result);
  };

  reader.readAsArrayBuffer(current_hack.file);

}

function startHack(file) {
  current_hack.file = file;
  try {
    var echonest = echonestAnalysis(file);
    echonest.setProgressCallback(displayString);
    echonest.go(processAnalysis);
  } catch(e) {
    console.log(e);
  }
}

$(document).ready(function() {
  registerFileDragDrop(document.body, document.getElementById("new_song"), startHack);
});