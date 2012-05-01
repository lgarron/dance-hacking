#!/usr/bin/python

# Usage ./waltz_blender.py file.wav
# Usage ./waltz_blender.py file.wav beats.json "12[34]" 100 0 4
# Usage ./waltz_blender.py file.wav beats.json [beat pattern] [percent overlap, normally 0 to 100] [offset in beats, normally 0, 1, 2, or 3] [beats per bar]


# This determines the hack structure
DEFAULT_PATTERN = "12[34]"

# Normally 0. Can be any other number less than beats_per_bar
DEFAULT_BEATS_SHIFT = 0

# Common values are 0.05 and 1.
DEFAULT_OVERLAP_RATIO = 1

# This may never get used.
DEFAULT_BEATS_PER_BAR = 4

# beats or tatums (smaller parts of beats)
SUBDIVISIONS = "beats"



# Now, time for the real work.
import wave, binascii, json, sys, struct, math

# Config
in_file_name = sys.argv[1]
beats_file_name = sys.argv[2]
overlap_ratio = DEFAULT_OVERLAP_RATIO
pattern = DEFAULT_PATTERN
beats_per_bar = DEFAULT_BEATS_PER_BAR
beats_per_bar_was_specified = False
beats_shift = DEFAULT_BEATS_SHIFT
beats_shift_was_specified = False

if len(sys.argv) > 3:
	pattern = sys.argv[3] # Beat Pattern

if len(sys.argv) > 4:
	overlap_ratio = float(sys.argv[4]) / 100 # Percent of the end of a beat that overlaps with the part right before the beginning of the next.

if len(sys.argv) > 5:
	beats_shift = int(sys.argv[5]) # Amount of beats to shift (e.g. try everything with the second beat as the first)
	beats_shift_was_specified = True

if len(sys.argv) > 6:
	beats_per_bar = int(sys.argv[6])
	beats_per_bar_was_specified = True



# c(beat) copies a beat straight
# b(b1, b2) blends from the start of b1 to the end of b2

def hack(b, c):
	i = 0
	while i < len(pattern):
		if str.isdigit(pattern[i]):
			p = int(pattern[i])
			c(p)
		elif pattern[i] == "[":
			p3 = pattern[i+3]
			if p3 != "]":
				print "WARNING: Pattern is irregular. No closing ] at position " + str(i+3)
			p1 = int(pattern[i+1])
			p2 = int(pattern[i+2])
			b(p1, p2)
			i += 3
		else:
			print "WARNING: Pattern is irregular at position " + str(i)
		i += 1



# Automatically detect the number of beats per bar based on the pattern
if not(beats_per_bar_was_specified):

	max_beat_index = 0
	def update_max_beat_index(i):
		global max_beat_index
		if i > max_beat_index:
			max_beat_index = i

	def update_max_beat_index_b(j, k):
		update_max_beat_index(j)
		update_max_beat_index(k)
	def update_max_beat_index_c(j):
		update_max_beat_index(j)

	hack(update_max_beat_index_b, update_max_beat_index_c)

	beats_per_bar = max_beat_index



print "Pattern:", pattern
print "Beats per bar:", beats_per_bar
print "Overlap Ratio:", overlap_ratio
print "Beats Shifted:", beats_shift


out_file_name = in_file_name
out_file_name += " - Pattern " + pattern
if beats_per_bar_was_specified:
	out_file_name += " - " + str(beats_per_bar) + " Beats Per Bar"
if beats_shift_was_specified:
	out_file_name += " - Shifted " + str(beats_shift) + " Beats"
out_file_name += " - Overlap " + str(math.trunc(100*overlap_ratio)) + " Percent"
out_file_name += ".wav";



# Read in beat data
beats_in = open(beats_file_name, 'r')
analysis_data = json.load(beats_in)

# Default: assume we just have a list of beats

beats = list()

if type(analysis_data) == list:
	beats = analysis_data
elif type(analysis_data) == dict:
	# Parse the echonest format manually.
	b = analysis_data[SUBDIVISIONS]
	beats = []
	for i in range(len(b)):
		beats.append([b[i]["start"]])
else:
	print "WARNING: Unknown beat data format."

beats_in.close()



# Open the audio file
file_in = wave.open(in_file_name, 'r')
print(file_in.getparams())

# Make sure the file is okay.
if (file_in.getnchannels() != 2):
	print "WARNING: Input file has", file_in.getnchannels(), "channels. Support is only for 2 channels right now."

if (file_in.getsampwidth() != 2):
	print "WARNING: Input file has", file_in.getsampwidth(), "bytes per sample. Only 16-bit (2 bytes) supported is supported right now."


# Frames of audio data per second.
hz = file_in.getframerate()

# If we want to hack everything on a different beat, just shift everything.
for i in range(beats_shift):
	beats.insert(0, beats[0])

# Returns the sample in the file that is at the i-th bar, j-th beat.
def idx(i, j):
  return math.trunc(beats[i*beats_per_bar+j][0] * hz)



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




num_bars = len(beats)/beats_per_bar - 1
for i in range(num_bars):

	def b(j, k): blend_beats(i, j, k)
	def c(j): copy_beat(i, j)

	hack(b, c)





# Add everything from the final bar onwards.
hack_data.append({
	"kind": "copy",
	"segment": {
		"start": idx(num_bars, 0),
		"end": file_in.getnframes()
	}
})



# Get ready to write the file.
file_out = wave.open(out_file_name, 'w')
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

def print_segment(seg):
	if seg["kind"] == "copy":
		sys.stdout.write("-")
	elif seg["kind"] == "blend":
		sys.stdout.write(">")
	else:
		sys.stdout.write("?")
	sys.stdout.flush()

# Go!
for seg in hack_data:
	print_segment(seg)
	handle[seg["kind"]](seg)


file_in.close()
file_out.close()

print "Done with " + out_file_name + "."