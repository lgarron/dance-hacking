#!/usr/bin/env python
# encoding: utf=8
"""
one.py

Digest only the first beat of every bar.

By Ben Lacker, 2009-02-18.
"""
import echonest.audio as audio
from echonest.selection import have_pitch_max,have_pitches_max

usage = """
Usage: 
    python one.py <input_filename> <output_filename>

Example:
    python one.py EverythingIsOnTheOne.mp3 EverythingIsReallyOnTheOne.mp3
"""

def main(input_filename, output_filename):
    audiofile = audio.LocalAudioFile(input_filename)
    bars = audiofile.analysis.bars
    collect = audio.AudioQuantumList()
    i=0
    for bar in bars:
      print len(bar.children()), len(bar.children()[0].children()), len(bar.children()[1].children()), len(collect)
      for j in range(len(bar.children())):
        if (j % 2 == 1):
          collect.append(bar.children()[j])
        else:
          collect.append(bar.children()[j].children()[0])
      
      i=(i+1) % 2
    out = audio.getpieces(audiofile, collect)
    out.encode(output_filename)

if __name__ == '__main__':
    import sys
    try:
        input_filename = sys.argv[1]
        output_filename = sys.argv[2]
    except:
        print usage
        sys.exit(-1)
    main(input_filename, output_filename)