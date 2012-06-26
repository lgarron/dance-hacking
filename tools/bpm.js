#!/usr/local/bin/node

"use strict";

var fs = require('fs');

if (process.argv.length < 3) {
  console.log("Usage:");
  console.log("  " + process.argv[1] + " " + "file_analysis.json");
  console.log("Prints the bpm of an echonest analysis file.");
  process.exit(0);
}


function mean(type, v) {

  var total = 0.0;
  for (var i = 1; i < v.length - 1; i++) {
    total += v[i+1][0]- v[i][0];
    console.log(v[i+1][0]);
    console.log(60/(v[i+1][0]- v[i][0]));
  }

  var meanBeatLength = total / (v.length - 2);
  var meanBeatTempo = 60. / meanBeatLength;

   console.log("manual BPM " + Math.round(meanBeatTempo*10)/10 + "");
}

try {
  var file_name = process.argv[2];
  var analysis = JSON.parse(fs.readFileSync(file_name));

  if (typeof analysis === "object" && typeof analysis["track"] === "object") {
    console.log("with confidence " + analysis["track"]["tempo_confidence"] + ", BPM " + Math.round(analysis["track"]["tempo"]*10)/10 + "");
  }
  else {
    mean("beats", analysis)
}
}
catch (e) {
  console.log("BPM could not be determined.");
}
