#!/usr/bin/python

# Usage ./waltz_blender.py beats.json 0 100 file.mp3
# Usage ./waltz_blender.py beats.json [offset in beats, normally 0, 1, 2, or 3] [percent overlap, normally 0 to 100] file.mp3

import wave, binascii, json, sys, struct, math

# Config
beats_shift = int(sys.argv[2]) # Amount of beats to shift (e.g. try everything with the second beat as the first)
overlap_ratio = float(sys.argv[3]) / 100 # Percent of the end of a beat that overlaps with the part right before the beginning of the next.



# Read in beat data
beats_in = open(sys.argv[1], 'r')
analysis_data = json.load(beats_in)

# Default: assume we just have a list of beats

beats = list()

if type(analysis_data) == list:
	beats = analysis_data
elif type(analysis_data) == dict:
	# Parse the echonest format manually.
	b = analysis_data["beats"]
	beats = []
	for i in range(len(b)):
		beats.append([b[i]["start"]])
else:
	print "WARNING: Unknown beat data format."

beats_in.close()



# Open the audio file
file_in = wave.open(sys.argv[4], 'r')
print(file_in.getparams())

# Make sure the file is okay.
if (file_in.getnchannels() != 2):
	print "WARNING: Input file has", file_in.getnchannels(), "channels. Support is only for 2 channels right now."

if (file_in.getsampwidth() != 2):
	print "WARNING: Input file has", file_in.getsampwidth(), "bytes per sample. Only 16-bit (2 bytes) supported is supported right now."



# Initialize arrays for storing the beat data
array_regular = []
array_blend = []
array_overlap = []

# Frames of audio data per second.
hz = file_in.getframerate()

# Assumed beats per bar.
bpb = 4

# If we want to hack everything on a different beat, just shift everything.
for i in range(beats_shift):
	beats.insert(0, beats[0])

# Returns the sample in the file that is at the i-th bar, j-th beat.
def idx(i, j):
  return math.trunc(beats[i*bpb+j][0] * hz)

num_bars = len(beats)/bpb - 1

# Figure out the maximum overlap among beats 2 (which occurs from index 2 to index 3) and 3.
for i in range(num_bars):
  array_overlap.append(
    math.trunc(min(
      idx(i, 3) - idx(i, 2),
      idx(i, 4) - idx(i, 3)
    ) * overlap_ratio)
  )

# For each bar, take everything at the beginning, until the blended overlap.
for i in range(num_bars):
  array_regular.append([
    idx(i, 0),
    idx(i, 3) - array_overlap[i] - 1
  ])

# Add everything after the final beat.
array_regular.append([
  math.trunc(beats[(len(beats)/bpb - 1)*bpb+0][0] * hz) + 1,
  file_in.getnframes() - 1
])

# Blend starting from the beginnings of beats 3 and 4.
for i in range(num_bars):
  array_blend.append([
    idx(i, 3) - array_overlap[i],
    idx(i, 4) - array_overlap[i]
  ])

# Make sure that the first and last beat extend to the ends of the song.
array_regular[0][0] = 0
array_regular[-1][1] = file_in.getnframes() - 1



# Get ready to write the file.
shift_names = ["12[34]", "1[23]4", "[12]34", "1]23[4"]

outName = sys.argv[4]+" - Pattern " + str(shift_names[beats_shift]) + " - Overlap " + str(math.trunc(100*overlap_ratio)) + " percent.wav";
file_out = wave.open(outName, 'w')
file_out.setnchannels(file_in.getnchannels())
file_out.setsampwidth(file_in.getsampwidth())
file_out.setframerate(file_in.getframerate())
# file_out.setnframes(file_in.getnframes())


for i in range(len(array_regular)):

	print "" + str(i+1) + "/" + str(len(array_regular)), file_in.tell(), array_regular[i][0]

	# Read and write the regular part of the bar.
	file_in.setpos(array_regular[i][0])
	frames = file_in.readframes(array_regular[i][1] + 1 - array_regular[i][0])
	file_out.writeframes(frames)

	if i < len(array_blend):

		# Read the data from first beat.
		file_in.setpos(array_blend[i][0])
		frames1 = file_in.readframes(array_overlap[i])

		# Read the data from second beat.
		file_in.setpos(array_blend[i][1])
		frames2 = file_in.readframes(array_overlap[i])
		
		out_blend = ""

		for j in range(array_overlap[i]):

			v1 = struct.unpack("<hh", frames1[j * 4: j * 4+4])
			v2 = struct.unpack("<hh", frames2[j * 4: j * 4+4])

			p = float(j)/array_overlap[i]

			mp1 = math.pow(1-p, 0.5)
			mp2 = math.pow(p, 0.5)

			newVLeft  = math.trunc(v1[0] * mp1 + v2[0] * mp2) # Issue at min vals?
			newVRight = math.trunc(v1[1] * mp1 + v2[1] * mp2) # Issue at min vals?


			newVLeft  = max(-32768, min(32767, newVLeft))
			newVRight = max(-32768, min(32767, newVRight))

			newV = struct.pack("<hh", newVLeft, newVRight)
 
			#print v1, v2, newVLeft, newVRight, j, overlapSamples, struct.unpack(">hh", newV), a, b, a == newVLeft, b == newVRight

			out_blend += newV

		file_out.writeframes(out_blend)


		#out_space = ""
		#for j in range(math.trunc(array_overlap[i]/overlap_ratio)):
		#	out_space += struct.pack("<hh", 0, 0)
		#file_out.writeframes(out_space)


file_in.close()
file_out.close()

print "Done with " + outName + "."