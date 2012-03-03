#!/usr/bin/env python
# encoding: utf=8

"""
beatcaster.py

Lucas Garron, garron.us

Program lazily hacked onto Tristan Jehan's swinger.py

TODO:

- Use something smarter to go by bars instead of beat cycles
- Allow the beat to change during the song? (e.g. combat detection errors)
- Apply pattern to sub-beats (like the swinger)
"""

from optparse import OptionParser
import os, sys
import string

from echonest.audio import LocalAudioFile, AudioData
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
    beat_pattern_len = len(beat_pattern)
    
    verb = bool(options.verbose)
    
    beats = track.analysis.beats
    offset = int(beats[0].start * track.sampleRate)
    
    # build rates
    rates = []
    n_beat = 0
    last_start = 0
    start = 0
    print "Running through beats..."
    for beat in beats[:-1]:
        last_start = start
        start = int(beat.start * track.sampleRate)
        if (int(beat_pattern[n_beat % beat_pattern_len]) != 0):
            rate = float(options.slowdown)/int(beat_pattern[n_beat % beat_pattern_len])
            if options.debug and (n_beat % beat_pattern_len)==(beat_pattern_len-1) and (n_beat > 0):
                rates.append(((start*9 + last_start)/10 - offset, 11*rate))	
            rates.append((start-offset, rate))
            if verb: print n_beat, start-offset, start, rate
            #print rate, start
            #if verb == True: print "Beat %d — split [%.3f|%.3f] — stretch [%.3f|%.3f] seconds" % (beats.index(beat), dur, beat.duration-dur, stretch, beat.duration-stretch)
        else:
            rates.append((start-offset, 0))
            if verb: print "Dropped beat."
        n_beat = n_beat + 1
    print "Done with beats."
    
    # get audio
    vecin = track.data[offset:int(beats[-1].start * track.sampleRate),:]
    # time stretch
    if verb == True: print "\nTime stretching..."
    vecout = dirac.timeScale(vecin, rates, track.sampleRate, 0)
    # build timestretch AudioData object
    ts = AudioData(ndarray=vecout, shape=vecout.shape, sampleRate=track.sampleRate, numChannels=vecout.shape[1])
    # initial and final playback
    pb1 = Playback(track, 0, beats[0].start)
    pb2 = Playback(track, beats[-1].start, track.analysis.duration-beats[-1].start)

    return [pb1, ts, pb2]

def main():
    usage = "usage: %s [options] <one_single_mp3>" % sys.argv[0]

    parser = OptionParser(usage=usage)
    parser.add_option("-p", "--pattern", default="1", help="tempo pattern, default 1 (every beat at same tempo)\
    	Each beat will be sped up by a factor of the corresponding digit in the pattern. 0 will drop a beat\
    	1122 will take each four beats, and squish the last two (making a waltz)\
    	12 will squish every alternating beat (long swing, depending on the song)\
        1110 will drop every 4th beat\
    	Much crazier is possible. Also note that the beat detection is sometimes off/ not aligned with bars.\
    	Use -d with \"1111\" to find out what four beats will be grouped at a time.\"\
    	")
    parser.add_option("-s", "--slowdown", default=1, help="General factor of slowdown")
    parser.add_option("-f", "--format", default="mp3", help="Output format (e.g. mp3, wav)")
    parser.add_option("-d", "--debug", action="store_true", help="General factor of slowdown")
    parser.add_option("-v", "--verbose", action="store_true", help="show results on screen")
    
    (options, args) = parser.parse_args()
    if len(args) < 1:
        parser.print_help()
        return -1
    
    track = None
    mp3 = args[0]
    
    if os.path.exists(mp3 + '.json'):
        track = AnalyzedAudioFile(mp3)
    else:
        track = LocalAudioFile(mp3)
    
    # this is where the work takes place
    actions = do_work(track, options)
    
    if bool(options.verbose) == True:
        display_actions(actions)
    
    # Send to renderer
    name = os.path.splitext(os.path.basename(args[0]))
    beat_signature = options.pattern;
    if (float(options.slowdown) != 1):
    	beat_signature = beat_signature + "_" + options.slowdown
    name = name[0]+'_'+beat_signature+'.'+options.format
    name = name.replace(' ','')
    
    print "Rendering..."
    render(actions, name)
    return 1


if __name__ == "__main__":
    try:
        main()
    except Exception, e:
        print e
