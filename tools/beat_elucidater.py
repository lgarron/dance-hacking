#!/usr/bin/env python
# encoding: utf=8

"""
inception.py

Lucas Garron, garron.us

Really buggy hack of beatcaster.py to add Inception sounds to a song

TODO:
- Fix normalization.

"""

from optparse import OptionParser
import os, sys
import string
import numpy

from echonest.audio import LocalAudioFile, AudioData, AudioData32
from echonest.action import render, Playback, display_actions

try:
    if hasattr(os, 'uname') and os.uname()[0] == 'Darwin':
        # The default dlopenflags setting, RTLD_NOW, causes us to look for stuff that's defined in -framework Carbon
        # and then barf. Let's take it nice and lazy instead.
        f = sys.getdlopenflags()
        sys.setdlopenflags(0)
        import dirac
        sys.setdlopenflags(f)
    else:
        import dirac
except Exception, e:
    sys.exit("Unable to load dirac, which is required for Crossmatch. Please install pydirac: %s" % e)

def do_work(track, options):

    beat_pattern = string.replace(options.pattern, "-", "")
    options.downbeat_offset = -0.03

    # beat_pattern_len = 6
    # click_beats = [1, 4]

    beat_pattern_len = 6
    click_beats = [1, 4]


    verb = bool(options.verbose)
    
    beats = track.analysis.tatums
    offset = int(beats[0].start * track.sampleRate)

    sounds = []
    for i in range(0, 9):
        file = "number_clips/" + str(i) + ".mp3"
        sounds.append(AudioData(file))
    options.downbeat_offset

    # build rates
    rates = []
    bar_starts = []
    n_beat = 0
    last_start = 0
    start = 0
    
    track_main = AudioData32(ndarray = track.data, shape=track.data.shape, sampleRate=track.sampleRate, numChannels=track.data.shape[1])
    
    # TODO: Bug if times overlap past the end of the original
    if verb == True: print "Running through beats..."
    for i in range(len(beats)):
        i_count = (i % beat_pattern_len) + 1
        if i_count in click_beats:
            if verb == True: print beats[i].start, i, i_count
            print float(beats[i].start) + float(options.downbeat_offset)
            track_main.add_at(float(beats[i].start) + float(options.downbeat_offset), sounds[i_count])
       #print rate, start
        #if verb == True: print "Beat %d — split [%.3f|%.3f] — stretch [%.3f|%.3f] seconds" % (beats.index(beat), dur, beat.duration-dur, stretch, beat.duration-stretch)
    if verb == True: print "Done with beats."


    return track_main

def main():
    usage = "usage: %s [options] <one_single_mp3>" % sys.argv[0]

    parser = OptionParser(usage=usage)
    parser.add_option("-p", "--pattern", default="1", help="tempo pattern, default 1 (every beat at same tempo)\
    	Each beat will be sped up by a factor of the corresponding digit in the pattern.\
    	1122 will take each four beats, and squish the last two (making a waltz)\
    	12 will squish every alternating beat (long swing, depending on the song)\
    	Much crazier is possible. Also note that the beat detection is sometimes off/ not aligned with bars.\
    	Use -d with \"1111\" to find out what four beats will be grouped at a time.\"\
    	")
    parser.add_option("-s", "--slowdown", default=1, help="General factor of slowdown")
    parser.add_option("-d", "--debug", action="store_true", help="General factor of slowdown")
    parser.add_option("--downbeat", default=-1, help="Downbeat index in the pattern.")
    parser.add_option("--downbeat_file", default=0, help="File to use for downbeat sound.")
    parser.add_option("--downbeat_offset", default=0, help="Amount of seconds to shift beat back.")
    parser.add_option("-v", "--verbose", action="store_true", help="show results on screen")
    
    (options, args) = parser.parse_args()
    if len(args) < 1:
        parser.print_help()
        return -1
    
    track = None
    mp3 = args[0]
    
    track = LocalAudioFile(mp3)
    print "Go!"
    
    # this is where the work takes place
    actions = do_work(track, options)
    if bool(options.verbose): print "\t2..."

    
        #if bool(options.verbose) == True:
            #display_actions(actions)
    
    if bool(options.verbose): print "\t2..."
    # Send to renderer
    name = os.path.splitext(os.path.basename(args[0]))
    beat_signature = options.pattern;
    if (float(options.slowdown) != 1):
    	beat_signature = beat_signature + "_" + options.slowdown
    name = name[0]+'_'+beat_signature+'.mp3'
    name = name.replace(' ','')
    if bool(options.verbose): print "\t2..."

    print "Rendering..."
    actions.encode(filename=name)
    return 1


if __name__ == "__main__":
    try:
        main()
    except Exception, e:
        print e
