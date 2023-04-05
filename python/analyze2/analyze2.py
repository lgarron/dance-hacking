#!/usr/bin/env python3.7

from amen.utils import example_audio_file
from amen.audio import Audio
from amen.synthesize import synthesize

import sklearn
print(sklearn)

# audio_files = open(
#     "/Users/lgarron/Music/iTunes/iTunes Media/Music/Compilations/Home in Pasadena_ The Very Best of the Pasadena Roof Orchestra/1-01 Home in Pasadena.m4a", 'r')

# audio_file = file)
audio = Audio(example_audio_file())

beats = audio.timings['beats']
beats.reverse()

out = synthesize(beats)
out.output('reversed.wav')
