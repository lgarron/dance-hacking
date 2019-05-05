import {registerFileDragDrop} from "./drag-drop-file"
import {analyze} from "./analyze"
import {Analysis} from "./common"
import {hackData} from "./beatcaster"
import {createWaveFileData} from "./wav"
import {saveAs} from "./lib/FileSaver.ts"

var current_hack = {
  hack_data: null,
  audio_analysis: null,
  blob: null,
  file: null
};

function displayString(str) {
  console.log(str);
  // document.getElementById("output_bpm").stop().fadeOut(0).html(str).fadeIn(100);
}

function saveFile() {
  var fileName = "Filename"; //current_hack.audio_analysis.meta.title;
  if(fileName === "") {
    fileName = "Song";
  }
  var extension = ".wav";
  saveAs(current_hack.blob, fileName + extension);
}

function rehack() {
  current_hack.file && startHack(current_hack.file);
}

function display_analysis (audio_analysis) {
  document.getElementById("output_text").setAttribute("value", "Analyzed");
  // document.getElementById("output_text").attr("value", JSON.stringify(audio_analysis, null, 2)).fadeOut(0).fadeIn(400);
  // document.getElementById("analysis_title").html(audio_analysis.meta.title);
  // var time = "" + Math.floor(audio_analysis.meta.seconds/60) + ":" + Math.floor((audio_analysis.meta.seconds % 60)/10) + Math.floor(audio_analysis.meta.seconds % 10);
  // document.getElementById("analysis_time").html(time);
  // document.getElementById("analysis_artist").html(audio_analysis.meta.artist);
  // document.getElementById("analysis_album").html(audio_analysis.meta.album);
  // document.getElementById("analysis_bpm").html(Math.round(audio_analysis.track.tempo)) ;
  // var keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // document.getElementById("analysis_key").html(keys[audio_analysis.track.key]);
  // var modes = ["Minor", "Major"];
  // document.getElementById("analysis_mode").html(modes[audio_analysis.track.mode]);
  // document.getElementById("analysis_bpm_confidence").html(Math.round(audio_analysis.track.tempo_confidence * 100));
  // document.getElementById("analysis_key_confidence").html(Math.round(audio_analysis.track.key_confidence * 100));
  // document.getElementById("analysis_mode_confidence").html(Math.round(audio_analysis.track.mode_confidence * 100));
  document.getElementById("analysis_info").classList.remove("hidden");

}

function hackSong(data) {
  console.log(data);

  var context = new AudioContext();
  context.decodeAudioData(data, function(buffer) {

    current_hack.hack_data = hackData(
      buffer,
      current_hack.audio_analysis,
      document.getElementById("beat_pattern").value,
      document.getElementById("overlap").value / 100,
      document.getElementById("beat_type_tatums").checked
    );

    var w = createWaveFileData(buffer, current_hack.hack_data);
    current_hack.blob = new Blob([w]);
    var hackedSongBlobURL = webkitURL.createObjectURL(current_hack.blob);

    // Update UI

    document.getElementById("download_button_div").classList.remove("hidden");
    document.getElementById("download_button").addEventListener("click", saveFile);

    document.getElementById("output_audio").src = hackedSongBlobURL;
    if (document.getElementById("autoplay_hack").checked) {
      document.getElementById("output_audio").play();
    }
    //displayString("Hacked version of \"" + current_hack.audio_analysis.meta.title + "\" is playing.");
    document.getElementById("new_song").classList.add("hidden");
    document.getElementById("output_bpm").classList.add("hidden");
    
    document.getElementById("rehack_button").addEventListener("click", rehack);

  }, function(e) {
    displayString("Failed to decode audio file (unknown reason). :-(");
    console.log(e);
  });

}

function processAnalysis(audio_analysis: Analysis) {

  current_hack.audio_analysis = audio_analysis;
  display_analysis(audio_analysis);
  // displayString("BPM of \"" + audio_analysis.meta.title + "\" is: " + audio_analysis.track.tempo + "<br>(confidence: " + Math.round(100 * audio_analysis.track.tempo_confidence) + "%)");
  displayString("Please wait a moment for waltzification.");

  var reader = new FileReader();

  reader.onload = function(fileEvent) {
    hackSong(fileEvent.target.result);
  };

  reader.readAsArrayBuffer(current_hack.file);

}

// From http://web.ist.utl.pt/antonio.afonso/www.aadsm.net/libraries/id3/index.js
// Used at http://web.ist.utl.pt/antonio.afonso/www.aadsm.net/libraries/id3/
// See original demo at https://github.com/aadsm/JavaScript-ID3-Reader/issues/3
function setBackground(file) {
  // TODO

  // console.log("Loading ID3 tags.");
  // var url = file.urn || file.name;
  // var reader = new FileAPIReader(file);
  // ID3.loadTags(url, function() {
  //   console.log("Loaded ID3 tags.");
  //   var tags = ID3.getAllTags(url);
  //   var image = tags.picture;
  //   if (typeof image !== "undefined") {
  //     document.body.background = "data:" + image.format + ";base64," + Base64.encodeBytes(image.data);
  //   }
  //   else {
  //     console.log("No image.");
  //   }
  // }, {
  //   tags: ["picture"],
  //   dataReader: reader
  // });
}

function startHack(file) {
  current_hack.file = file;

  try {setBackground(current_hack.file); }
  catch (e) {console.log(e); }

  // try {
    const analyis = analyze(file);
    // echonest.setProgressCallback(displayString);
    processAnalysis(analyis);
  // } catch(e) {
  //   console.error(e);
  // }
}

window.addEventListener("load", function() {
  registerFileDragDrop(document.body, document.getElementById("new_song"), startHack);
})
