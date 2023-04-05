#!/usr/bin/env python
# encoding: utf=8

"""
analyze.py

Based on processing code from the Swinger.
"""

from optparse import OptionParser
import os, sys
import dirac

from echonest.audio import LocalAudioFile, AudioData
from echonest.action import render, Playback, display_actions

def main():
    usage = "usage: %s [options] <one_single_mp3>" % sys.argv[0]
    parser = OptionParser(usage=usage)
    parser.add_option("-v", "--verbose", action="store_true", help="show results on screen")
    
    (options, args) = parser.parse_args()
    if len(args) < 1:
        parser.print_help()
        return -1
    
    verbose = options.verbose
    track = None
    
    track = LocalAudioFile(args[0], verbose=verbose)

    if verbose:
        print "Converting data . . ."
    
    beats=[];
    for i in track.analysis.beats:
        beats.append([i.start, i.duration, i.confidence])
    
    filename = args[0] + ".json"
    file = open(filename, "w")
    file.write(str(beats))
    

    if verbose:
        print "Success!"
    return 1


if __name__ == "__main__":
    try:
        main()
    except Exception, e:
        print e
