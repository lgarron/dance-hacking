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



hack_data = []

# Note that this accounts for indexing so that "1" is the start of the first beat.
def copy_beat(i, j):
  hack_data.append({
  	"kind": "copy",
  	"segment": {
  		"start": idx(i, j-1),
  		"end": idx(i, j)
  	}
  })

def blend_beats(i, j, k):
  hack_data.append({
  	"kind": "blend",
  	"segment1": {
  		"start": idx(i, j-1),
  		"end": idx(i, j)
  	},
  	"segment2": {
  		"start": idx(i, k-1),
  		"end": idx(i, k)
  	}
  })



# Everything up to the first beat
hack_data.append({
	"kind": "copy",
	"segment": {
		"start": 0,
		"end": idx(0, 0)
	}
})




num_bars = len(beats)/bpb - 1
for i in range(num_bars):

	# This determines the hack structure
	copy_beat(i, 1)
	copy_beat(i, 2)
	blend_beats(i, 3, 4)





# Add everything from the final bar onwards.
hack_data.append({
	"kind": "copy",
	"segment": {
		"start": idx(num_bars, 0),
		"end": file_in.getnframes()
	}
})



# Get ready to write the file.
shift_names = ["12[34]", "1[23]4", "[12]34", "1]23[4"]

outName = sys.argv[4]+" - Pattern " + str(shift_names[beats_shift]) + " - Overlap " + str(math.trunc(100*overlap_ratio)) + " percent.wav";
file_out = wave.open(outName, 'w')
file_out.setnchannels(file_in.getnchannels())
file_out.setsampwidth(file_in.getsampwidth())
file_out.setframerate(file_in.getframerate())
# file_out.setnframes(file_in.getnframes())

def _copy(seg):
	file_in.setpos(seg["segment"]["start"])
	num_frames = seg["segment"]["end"] - seg["segment"]["start"]
	frames = file_in.readframes(num_frames)
	file_out.writeframes(frames)

def _blend(seg):

	num_overlap_samples = math.trunc(
		overlap_ratio * min(
			seg["segment1"]["end"] - seg["segment1"]["start"],
			seg["segment2"]["end"] - seg["segment2"]["start"]
		)
	)

	_copy({
		"kind": "copy",
		"segment": {
			"start": seg["segment1"]["start"],
			"end": seg["segment1"]["end"] - num_overlap_samples
		}
	})

	# Read the data from first beat.
	file_in.setpos(seg["segment1"]["end"] - num_overlap_samples)
	frames1 = file_in.readframes(num_overlap_samples)

	# Read the data from second beat.
	file_in.setpos(seg["segment2"]["end"] - num_overlap_samples)
	frames2 = file_in.readframes(num_overlap_samples)
	
	out_blend = ""

	def clip(i):
		return max(-32768, min(32767, math.trunc(i)))

	for j in range(num_overlap_samples):

		s1_data = struct.unpack("<hh", frames1[j*4: j*4+4])
		s2_data = struct.unpack("<hh", frames2[j*4: j*4+4])

		s2_weight = float(j)/num_overlap_samples

		s1_scale = math.pow(1-s2_weight, 0.5)
		s2_scale = math.pow(s2_weight, 0.5)

		new_s1  = clip(s1_data[0] * s1_scale + s2_data[0] * s2_scale)
		new_s2 = clip(s1_data[1] * s1_scale + s2_data[1] * s2_scale)

		newV = struct.pack("<hh", new_s1, new_s2)

		#print sample1_data, sample2_data, new_sample1, newVRight, j, overlapSamples, struct.unpack(">hh", newV), a, b, a == new_sample1, b == new_sample2t

		out_blend += newV

	file_out.writeframes(out_blend)


handle = {
	"copy": _copy,
	"blend": _blend
}

# Go!
for seg in hack_data:
	print(seg)
	handle[seg["kind"]](seg)


file_in.close()
file_out.close()

print "Done with " + outName + "."