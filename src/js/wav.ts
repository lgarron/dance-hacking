import type { HackData, HackSpecBeatBlend, HackSpecBeatCopy } from "./types";

type bufferData = Uint8Array<ArrayBuffer>;

// Based on audiojedit.js

const writeString = function (s: string, a: bufferData, offset: number) {
  for (let i = 0; i < s.length; ++i) {
    a[offset + i] = s.charCodeAt(i);
  }
};

const writeInt16 = function (n: number, a: bufferData, offset: number) {
  const intN = n | 0;
  a[offset + 0] = intN & 255;
  a[offset + 1] = (intN >> 8) & 255;
};

const writeInt32 = function (n: number, a: bufferData, offset: number) {
  const intN = n | 0;
  a[offset + 0] = intN & 255;
  a[offset + 1] = (intN >> 8) & 255;
  a[offset + 2] = (intN >> 16) & 255;
  a[offset + 3] = (intN >> 24) & 255;
};

// const writeAudioBuffer = function (
//   audioBuffer: AudioBuffer,
//   a: bufferData,
//   initialOffset: number,
//   _beat: number,
//   _overlap: number,
// ) {
//   let offset = initialOffset;
//   const n = audioBuffer.length;
//   const bufferL = audioBuffer.getChannelData(0);
//   let sampleL: number;
//   const bufferR = audioBuffer.getChannelData(1);
//   let sampleR: number;

//   for (let i = 0; i < n; ++i) {
//     sampleL = bufferL[i] * 32768.0;
//     sampleR = bufferR[i] * 32768.0;

//     // Clip left and right samples to the limitations of 16-bit.
//     // If we don't do this then we'll get nasty wrap-around distortion.
//     if (sampleL < -32768) {
//       sampleL = -32768;
//     }
//     if (sampleL > 32767) {
//       sampleL = 32767;
//     }
//     if (sampleR < -32768) {
//       sampleR = -32768;
//     }
//     if (sampleR > 32767) {
//       sampleR = 32767;
//     }

//     writeInt16(sampleL, a, offset);
//     writeInt16(sampleR, a, offset + 2);
//     offset += 4;
//   }
// };

function copy(
  audioBuffer: AudioBuffer,
  a: bufferData,
  initialOffset: number,
  beat: HackSpecBeatCopy,
  _overlap: number,
): number {
  let offset = initialOffset;
  const bufferL = audioBuffer.getChannelData(0);
  let sampleL: number;
  const bufferR = audioBuffer.getChannelData(1);
  let sampleR: number;

  // console.log(beat);
  const startSample = Math.floor(audioBuffer.sampleRate * beat.segment.start);
  // console.log(audioBuffer.sampleRate);
  // console.log(beat["segment"]["start"]);
  const endSample = Math.floor(audioBuffer.sampleRate * beat.segment.end);
  //console.log(startSample);
  // console.log(endSample);
  for (let i = startSample; i < endSample; ++i) {
    sampleL = bufferL[i] * 32768.0;
    sampleR = bufferR[i] * 32768.0;

    // Clip left and right samples to the limitations of 16-bit.
    // If we don't do this then we'll get nasty wrap-around distortion.
    if (sampleL < -32768) {
      sampleL = -32768;
    }
    if (sampleL > 32767) {
      sampleL = 32767;
    }
    if (sampleR < -32768) {
      sampleR = -32768;
    }
    if (sampleR > 32767) {
      sampleR = 32767;
    }

    writeInt16(sampleL, a, offset);
    writeInt16(sampleR, a, offset + 2);
    offset += 4;
  }
  return offset;
}

function blend(
  audioBuffer: AudioBuffer,
  a: bufferData,
  initialOffset: number,
  beat: HackSpecBeatBlend,
  overlap: number,
): number {
  let offset = initialOffset;
  const bufferL = audioBuffer.getChannelData(0);
  let sampleL: number;
  const bufferR = audioBuffer.getChannelData(1);
  let sampleR: number;

  const num_overlap_samples = Math.floor(
    audioBuffer.sampleRate *
      overlap *
      Math.min(
        beat.segment1.end - beat.segment1.start,
        beat.segment2.end - beat.segment2.start,
      ),
  );

  offset = copy(
    audioBuffer,
    a,
    offset,
    {
      kind: "copy",
      segment: {
        start: beat.segment1.start,
        end: beat.segment1.end - num_overlap_samples / audioBuffer.sampleRate, //TODO: prevent rounding error
      },
    },
    overlap,
  );

  //console.log(num_overlap_samples);
  for (let i = 0; i < num_overlap_samples; ++i) {
    const sample1L =
      bufferL[
        Math.floor(audioBuffer.sampleRate * beat.segment1.end) -
          num_overlap_samples +
          i
      ] * 32768.0;
    const sample1R =
      bufferR[
        Math.floor(audioBuffer.sampleRate * beat.segment1.end) -
          num_overlap_samples +
          i
      ] * 32768.0;
    const sample2L =
      bufferL[
        Math.floor(audioBuffer.sampleRate * beat.segment2.end) -
          num_overlap_samples +
          i
      ] * 32768.0;
    const sample2R =
      bufferR[
        Math.floor(audioBuffer.sampleRate * beat.segment2.end) -
          num_overlap_samples +
          i
      ] * 32768.0;

    //console.log(sample1L);
    const s2_weight = i / num_overlap_samples;

    const s1_scale = (1 - s2_weight) ** 0.5;
    const s2_scale = s2_weight ** 0.5;

    sampleL = sample1L * s1_scale + sample2L * s2_scale;
    sampleR = sample1R * s1_scale + sample2R * s2_scale;

    // Clip left and right samples to the limitations of 16-bit.
    // If we don't do this then we'll get nasty wrap-around distortion.
    if (sampleL < -32768) {
      sampleL = -32768;
    }
    if (sampleL > 32767) {
      sampleL = 32767;
    }
    if (sampleR < -32768) {
      sampleR = -32768;
    }
    if (sampleR > 32767) {
      sampleR = 32767;
    }

    writeInt16(sampleL, a, offset);
    writeInt16(sampleR, a, offset + 2);
    offset += 4;
  }
  return offset;
}

export function createWaveFileData(
  audioBuffer: AudioBuffer,
  hackData: HackData,
) {
  const outputFrameLength = hackData.num_samples;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numberOfChannels * bitsPerSample) / 8;
  const blockAlign = (numberOfChannels * bitsPerSample) / 8;
  const wavDataByteLength = outputFrameLength * numberOfChannels * 2;
  // 16-bit audio
  const headerByteLength = 44;
  const totalLength = headerByteLength + wavDataByteLength;
  const waveFileData = new Uint8Array(totalLength);
  const subChunk1Size = 16;
  // for linear PCM
  const subChunk2Size = wavDataByteLength;
  const chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

  const overlap = hackData.overlap;
  //console.log(overlap);

  writeString("RIFF", waveFileData, 0);
  writeInt32(chunkSize, waveFileData, 4);
  writeString("WAVE", waveFileData, 8);
  writeString("fmt ", waveFileData, 12);

  writeInt32(subChunk1Size, waveFileData, 16); // SubChunk1Size (4)
  writeInt16(1, waveFileData, 20); // AudioFormat (2)
  writeInt16(numberOfChannels, waveFileData, 22); // NumChannels (2)
  writeInt32(sampleRate, waveFileData, 24); // SampleRate (4)
  writeInt32(byteRate, waveFileData, 28); // ByteRate (4)
  writeInt16(blockAlign, waveFileData, 32); // BlockAlign (2)
  writeInt32(bitsPerSample, waveFileData, 34); // BitsPerSample (4)
  writeString("data", waveFileData, 36);
  writeInt32(subChunk2Size, waveFileData, 40); // SubChunk2Size (4)

  // Write actual audio data starting at offset 44.
  const { segments } = hackData;
  let offset = 44;
  for (const segment of segments) {
    //console.log("Loop #" + i);
    const fn = segment.kind === "copy" ? copy : blend;
    // @ts-ignore TypeScript doesn't have enough inference power to handle this.
    offset = fn(audioBuffer, waveFileData, offset, segment, overlap);
  }

  return waveFileData;
}
