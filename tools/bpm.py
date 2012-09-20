#!/usr/bin/python

import os, argparse, math, json

parser = argparse.ArgumentParser(description='Calculate the BPM from a JSON file.')
parser.add_argument('file', action="store", metavar='file', type=argparse.FileType('r'))
parser.add_argument('-v', action="store_true", default=False, help="verbose")
args = parser.parse_args()


def mean(type, v):
  total = 0.0
  for i in range(1, len(v)-1):
    total += v[i+1][0]- v[i][0];
    if args.v:
      print v[i+1][0], 60/(v[i+1][0]- v[i][0])

  meanBeatLength = total / (len(v) - 2)
  meanBeatTempo = 60. / meanBeatLength

  print "manual BPM", round(meanBeatTempo, 1)

try:
  
  analysis = json.load(args.file)

  if type(analysis) == dict and type(analysis["track"]) == dict:
    confidence = analysis["track"]["tempo_confidence"]
    bpm = round(analysis["track"]["tempo"], 1)
    print "with confidence", confidence, ", BPM", bpm
  else:
    mean("beats", analysis)
except:
  print "BPM could not be determined."