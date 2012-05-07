/*
 *  lgwav.h
 *  lgsound2png
 *
 *  Created by Lucas Garron on Mar 3/1/11.
 *  Copyright 2011 Serendipity. All rights reserved.
 *
 */

#ifndef LGWAV_H
#define LGWAV_H

#define RETURN_OKAY 0

#define ABS(A) (((A)>0) ? (A) : (-(A)))
#define MAX(A, B) (((A)>(B)) ? (A) : (B))
#define MIN(A, B) (((A)<(B)) ? (A) : (B))


typedef struct RIFF_header
{
	char ChunkID[4];
	int ChunkSize;
	char Format[4];
} RIFF_header;

typedef struct fmt_chunk
{
	char Subchunk1ID[4];
	int Subchunk1Size;
	char AudioFormat[2];
	char NumChannels[2];
	int SampleRate;
	int ByteRate;
	char BlockAlign[2];
	char BitsPerSample[2];
} fmt_chunk;

typedef struct data_chunk_start
{
	char Subchunk2ID[4];
	int Subchunk2Size;
} data_chunk_start;

/*
 * The interpretation of the raw file
 * read into memory.
 */
typedef struct wave_file
{
	struct RIFF_header header;
	struct fmt_chunk fmtChunk;
	struct data_chunk_start dataChunkStart;
	char data; /* First byte of data. I would use char data[], but that's not ANSI*/
} wave_file;

/*
 * Structure passed around to do computation.
 */
typedef struct wave
{
	struct wave_file* waveFile;
	size_t fileSize;
	
	int numChannels;
	int numSamples;
	int sampleRate;
	
	int blockAlign;
	int bytesPerSample;
	
	char* data;	
} wave;

int open_and_read_file(char* filename, struct wave* w);

void cleanup_wave(struct wave* w);

struct wave* ini_wave(char* filename);

int sample_at(struct wave* w, int channel, int sample_num);

#endif