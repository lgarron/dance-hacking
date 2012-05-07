#!/usr/local/bin/node

"use strict";

var fs = require('fs');

if (process.argv.length < 3) {
  console.log("Usage:");
  console.log("  " + process.argv[1] + " " + "beats.json");
  console.log("Computes the average beat length of a file, given a raw list [[beat_start, ...], [beat_start, ...], ...].");
  process.exit(0);
}

var file_name = process.argv[2];
var analysis = JSON.parse(fs.readFileSync(file_name));

function mean(type, v) {

  var total = 0.0;
  for (var i = 1; i < v.length - 1; i++) {
    total += v[i+1][0]- v[i][0];
  }

  var meanBeatLength = total / (v.length - 2);
  var meanBeatTempo = 60. / meanBeatLength;

  console.log("[" + process.argv[2] + "]" + "[" + type + "] Mean length: " + meanBeatLength);
  console.log("[" + process.argv[2] + "]" + "[" + type + "] Mean BPM: " + meanBeatTempo);

}

mean("beats", analysis)