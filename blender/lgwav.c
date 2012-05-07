
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "lgwav.h"

typedef unsigned long SAMPLE;

#define BITS_PER_BYTE 8
#define PRINT_DIVISION "---------------------------------\n"


static int DEBUGLEVEL = 10;
#define DPRINTF if(DEBUGLEVEL>5)printf


/*
 * Using WAVE specification little-endianness.
 * Would make inline, but that's not ANSI.
 */
/*inline*/ int int_from_bytes_little_endian(char* bytes, int numBytes)
{
	int i, out=0;
	for(i = numBytes-1; i>=0; i--) {
		out = (out << BITS_PER_BYTE) + (bytes[i]);
	}
	return out;
}

/*
 * Reads file into memory
 * Reports size through passed argument.
 * Returns pointer to allocated file in memory.
 */
int open_and_read_file(char* filename, struct wave* w)
{
	FILE *file;
	
	file = fopen(filename, "r");	
	DPRINTF("Opened file: %s\n", filename);
	
	/* Get file size. */
	fseek(file, 0, SEEK_END);
	w->fileSize = ftell(file);
	fseek(file, 0, SEEK_SET);
	DPRINTF("FileSize: %d (bytes)\n", (int)(w->fileSize));
	
	/*
	 * Should probably use mmap, but that's a bit more annoying,
	 * and malloc+read should be fast enough for a reasonable WAVE file.
	 */
	w->waveFile = malloc(w->fileSize);
	fread(w->waveFile, w->fileSize, 1, file);
	assert(ftell(file) == (w->fileSize));
	
	fclose(file);
	
	DPRINTF("waveFile begins at %p\n", (void*)(w->waveFile));
	
	return RETURN_OKAY;
}

/*
 * File was closed after the entire read,
 * so currently only need to free the file.
 */
void cleanup_wave(struct wave* w)
{
	free(w->waveFile);
}

/*
 * Check 12-byte RIFF header against specification and file size.
 * Checks all 3 header fields for validity.
 * Compares the read-in file size to header-specified size.
 *
 * Returns RETURN_OKAY on success.
 */
int check_header(struct wave* w)
{
	struct RIFF_header* header;
	
	header = &(w->waveFile->header);
	
	DPRINTF(PRINT_DIVISION);
	
	DPRINTF("ChunkID: \"%.4s\" (should be \"RIFF\")\n", header->ChunkID);
	assert(strncmp("RIFF", header->ChunkID, 4)==0);
	
	DPRINTF("ChunkSize: %d (should == FileSize-%d)\n", header->ChunkSize, 8);
	assert(header->ChunkSize == (w->fileSize)-8);
	
	DPRINTF("Format: \"%.4s\" (should be \"WAVE\")\n", header->Format);
	assert(strncmp("WAVE", header->Format, 4)==0);
	
	return RETURN_OKAY;
}

/*
 * Check Format Chunk (Subchunk 1)
 *
 * Returns RETURN_OKAY on success.
 */
int check_fmt_chunk(struct wave* w)
{
	struct fmt_chunk* fmtChunk;
	void* computedDataChunkStartPointer;
	
	fmtChunk = &(w->waveFile->fmtChunk);
	
	DPRINTF(PRINT_DIVISION);
	
	DPRINTF("Subchunk1ID: \"%.4s\" (should be \"fmt \")\n", fmtChunk->Subchunk1ID);
	assert(strncmp("fmt ", fmtChunk->Subchunk1ID, 4)==0);
	
	DPRINTF("Subchunk1Size: %d (assuming 16 for PCM)\n", fmtChunk->Subchunk1Size);
	assert((fmtChunk->Subchunk1Size) == 16);
	
	DPRINTF("AudioFormat: %d (should be 1 for PCM)\n", int_from_bytes_little_endian(fmtChunk->AudioFormat,2 ));
	
	DPRINTF("NumChannels: %d (should be 1 or 2, preferably)\n", int_from_bytes_little_endian(fmtChunk->NumChannels, 2));
	
	DPRINTF("SampleRate: %d (samples per second)\n", fmtChunk->SampleRate);
	
	DPRINTF("ByteRate: %d (bytes per second)\n", fmtChunk->ByteRate);
	
	DPRINTF("BlockAlign: %d (bytes per block)\n", int_from_bytes_little_endian(fmtChunk->BlockAlign, 2));
	
	DPRINTF("BitsPerSample: %d\n", int_from_bytes_little_endian(fmtChunk->BitsPerSample, 2));
	
	assert(int_from_bytes_little_endian(fmtChunk->BlockAlign, 2) == int_from_bytes_little_endian(fmtChunk->NumChannels, 2) * int_from_bytes_little_endian(fmtChunk->BitsPerSample, 2) / BITS_PER_BYTE);
	assert((fmtChunk->ByteRate) == (fmtChunk->SampleRate) * int_from_bytes_little_endian(fmtChunk->BlockAlign, 2));
	
	/* Making sure we have a canonical PCM file. */
	computedDataChunkStartPointer = (void*)(((char*)(&(fmtChunk->Subchunk1Size)))
											+ sizeof(fmtChunk->Subchunk1Size)
											+ (int)(fmtChunk->Subchunk1Size));
	DPRINTF("Computed Data Chunk Start Pointer: %p\n", computedDataChunkStartPointer);
	assert(computedDataChunkStartPointer == &(w->waveFile->dataChunkStart));
	
	return RETURN_OKAY;
}


/*
 * Check Data Chunk Start (Subchunk 2)
 *
 * Returns RETURN_OKAY on success.
 */
int check_data_chunk_start(struct wave* w)
{
	struct data_chunk_start* dataChunkStart;
	struct fmt_chunk* fmtChunk;
	
	dataChunkStart = &(w->waveFile->dataChunkStart);	
	fmtChunk = &(w->waveFile->fmtChunk);	
	
	DPRINTF(PRINT_DIVISION);
	
	DPRINTF("Subchunk2ID: \"%.4s\" (should be \"data\")\n", dataChunkStart->Subchunk2ID);
	assert(strncmp("data", dataChunkStart->Subchunk2ID, 4)==0);
	
	DPRINTF("Subchunk2Size: %d\n", dataChunkStart->Subchunk2Size);
	
	return RETURN_OKAY;
}

/*
 * Loads and sets up a wave struct.
 *
 * Returns pointer to a new wave file on success,
 * NULL on non-aborting error.
 */
struct wave* ini_wave(char* filename)
{
	struct wave* w;
	
	w = malloc(sizeof(wave));
	
	assert(open_and_read_file(filename, w) == RETURN_OKAY);
	assert(check_header(w) == RETURN_OKAY);
	assert(check_fmt_chunk(w) == RETURN_OKAY);
	assert(check_data_chunk_start(w) == RETURN_OKAY);
	
	w->numChannels = int_from_bytes_little_endian(w->waveFile->fmtChunk.NumChannels, 2);
	w->sampleRate = w->waveFile->fmtChunk.SampleRate;
	w->blockAlign = int_from_bytes_little_endian(w->waveFile->fmtChunk.BlockAlign, 2);
	w->bytesPerSample = int_from_bytes_little_endian(w->waveFile->fmtChunk.BitsPerSample, 2)/BITS_PER_BYTE;
	w->numSamples = (w->waveFile->dataChunkStart.Subchunk2Size)/(w->numChannels)/(w->bytesPerSample);
	w->data = (void*)(&((w->waveFile)->data));
	
	DPRINTF(PRINT_DIVISION);
	DPRINTF("Sanity Check\n");
	
	DPRINTF("w->numChannels: %d\n", w->numChannels);
	DPRINTF("w->sampleRate: %d\n", w->sampleRate);
	DPRINTF("w->blockAlign: %d\n", w->blockAlign);
	DPRINTF("w->bytesPerSample: %d\n", w->bytesPerSample);
	assert(w->bytesPerSample < sizeof(SAMPLE)); /* Otherwise, can't do computation safely. */
	DPRINTF("w->numSamples: %d\n", w->numSamples);
	DPRINTF("w->data: %p\n", w->data);
	
	return w;
}

/*
 * Channels are 0-indexed.
 *
 */
int sample_at(struct wave* w, int channel, int sample_num) {
	return int_from_bytes_little_endian((char*)(w->data)
										+(w->blockAlign)*sample_num
										+(w->bytesPerSample)*(MAX(channel, w->numChannels-1)),
										w->bytesPerSample);
}
