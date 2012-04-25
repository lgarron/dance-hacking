#!/usr/bin/python

# Usage ./waltz_blender.py beats.json 0 100 file.mp3
# Usage ./waltz_blender.py beats.json [offset in beats, normally 0, 1, 2, or 3] [percent overlap, normally 0 to 100] file.mp3

import wave, binascii, json, sys, struct, math

# Config
beats_shift = int(sys.argv[2]);
overlap_ratio = float(sys.argv[3]) / 100;

# Read in
beats_in = open(sys.argv[1], 'r')
analysis_data = json.load(beats_in)

b = analysis_data["beats"]
beats = []
for i in range(len(b)):
	beats.append([b[i]["start"]])


beats_in.close()

file_in = wave.open(sys.argv[4], 'r')
print(file_in.getparams())

array_regular = []
array_blend = []
array_overlap = []

hz = file_in.getframerate()

# For offsetting
for i in range(beats_shift):
	beats.insert(0, beats[0])


for i in range(len(beats)/4 - 1):
	array_overlap.append(
		math.trunc(min(
			math.trunc(beats[i*4+3][0] * hz) - math.trunc(beats[i*4+2][0] * hz),
			math.trunc(beats[i*4+4][0] * hz) - math.trunc(beats[i*4+3][0] * hz)
		) * overlap_ratio)
	)

for i in range(len(beats)/4 - 1):
	array_regular.append([
		math.trunc(beats[i*4+0][0] * hz) + 1,
		math.trunc(beats[i*4+3][0] * hz) - array_overlap[i]
	])

array_regular.append([
	math.trunc(beats[(len(beats)/4 - 1)*4+0][0] * hz) + 1,
	file_in.getnframes() - 1
])

for i in range(len(beats)/4 - 1):
	array_blend.append([
		math.trunc(beats[i*4+3][0] * hz) - array_overlap[i],
		math.trunc(beats[i*4+4][0] * hz) - array_overlap[i]
	])

array_regular[0][0] = 0
array_regular[-1][1] = file_in.getnframes() - 1


if (file_in.getnchannels() != 2):
	print "WARNING: Input file has", file_in.getnchannels(), "channels. Support is only for 2 channels right now."

if (file_in.getsampwidth() != 2):
	print "WARNING: Input file has", file_in.getsampwidth(), "bytes per sample. Only 16-bit (2 bytes) supported is supported right now."

shift_names = ["12[34]", "1[23]4", "[12]34", "1]23[4"]

outName = sys.argv[4]+" - Pattern " + str(shift_names[beats_shift]) + " - Overlap " + str(math.trunc(100*overlap_ratio)) + " percent.wav";
file_out = wave.open(outName, 'w')
file_out.setnchannels(file_in.getnchannels())
file_out.setsampwidth(file_in.getsampwidth())
file_out.setframerate(file_in.getframerate())
# file_out.setnframes(file_in.getnframes())


for i in range(len(array_regular)):

	print "" + str(i+1) + "/" + str(len(array_regular)), file_in.tell(), array_regular[i][0]
	#file_in.rewind()
	#file_in.readframes(array_regular[i][0])
	#print file_in.tell(), array_regular[i][0]
	file_in.setpos(array_regular[i][0])
	frames = file_in.readframes(array_regular[i][1] + 1 - array_regular[i][0])
	file_out.writeframes(frames)

	if i < len(array_blend):

		print array_overlap[i]

		file_in.setpos(array_blend[i][0])
		frames1 = file_in.readframes(array_overlap[i])

		file_in.setpos(array_blend[i][1])
		frames2 = file_in.readframes(array_overlap[i])
		
		out_blend = ""

		for j in range(array_overlap[i]):

			v1 = struct.unpack("<hh", frames1[j * 4: j * 4+4])
			v2 = struct.unpack("<hh", frames2[j * 4: j * 4+4])

			p = float(j)/array_overlap[i]

			newVLeft  = math.trunc(v1[0] * math.pow(1-p, 0.5) + v2[0] * math.pow(p, 0.5)) # Issue at min vals?
			newVRight = math.trunc(v1[1] * math.pow(1-p, 0.5) + v2[1] * math.pow(p, 0.5)) # Issue at min vals?


			newVLeft  = max(-32768, min(32767, newVLeft))
			newVRight = max(-32768, min(32767, newVRight))

			newV = struct.pack("<hh", math.trunc(newVLeft), math.trunc(newVRight))
 
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