

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

function displayString(str) {
  console.log(str);
  $("#output_bpm").stop().fadeOut(0).html(str).fadeIn(100);
}
function goData(data) {
  console.log("goData()");
  context.decodeAudioData(data, function(buffer) {

    buf = buffer;

    console.log("decoding1.0");
    hack_data = beatcaster.hackData(
      buffer,
      aa,
      document.getElementById("beat_pattern").value,
      document.getElementById("overlap").value / 100,
      document.getElementById("beat_type_tatums").checked
    );

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
  registerFileDragDrop(document.body, document.getElementById("new_song"), go);
  document.getElementById("rehack_button").addEventListener("click", rehack);
});