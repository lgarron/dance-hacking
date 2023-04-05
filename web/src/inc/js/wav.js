"use strict";

// Based on audiojedit.js

export const createWaveFileData = (function () {
  var writeString = function (s, a, offset) {
    for (var i = 0; i < s.length; ++i) {
      a[offset + i] = s.charCodeAt(i);
    }
  };

  var writeInt16 = function (n, a, offset) {
    n = n | 0;
    a[offset + 0] = n & 255;
    a[offset + 1] = (n >> 8) & 255;
  };

  var writeInt32 = function (n, a, offset) {
    n = n | 0;
    a[offset + 0] = n & 255;
    a[offset + 1] = (n >> 8) & 255;
    a[offset + 2] = (n >> 16) & 255;
    a[offset + 3] = (n >> 24) & 255;
  };

  var writeAudioBuffer = function (audioBuffer, a, offset) {
    var n = audioBuffer.length,
      bufferL = audioBuffer.getChannelData(0),
      sampleL,
      bufferR = audioBuffer.getChannelData(1),
      sampleR;

    for (var i = 0; i < n; ++i) {
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
  };

  var handle = {};
  handle["copy"] = function (audioBuffer, a, offset, beat, overlap) {
    var n = audioBuffer.length,
      bufferL = audioBuffer.getChannelData(0),
      sampleL,
      bufferR = audioBuffer.getChannelData(1),
      sampleR;

    // console.log(beat);
    var startSample = Math.floor(
      audioBuffer.sampleRate * beat["segment"]["start"],
    );
    // console.log(audioBuffer.sampleRate);
    // console.log(beat["segment"]["start"]);
    var endSample = Math.floor(audioBuffer.sampleRate * beat["segment"]["end"]);
    //console.log(startSample);
    // console.log(endSample);
    for (var i = startSample; i < endSample; ++i) {
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
  };

  handle["blend"] = function (audioBuffer, a, offset, beat, overlap) {
    var n = audioBuffer.length,
      bufferL = audioBuffer.getChannelData(0),
      sampleL,
      bufferR = audioBuffer.getChannelData(1),
      sampleR;

    var num_overlap_samples = Math.floor(
      audioBuffer.sampleRate *
        overlap *
        Math.min(
          beat["segment1"]["end"] - beat["segment1"]["start"],
          beat["segment2"]["end"] - beat["segment2"]["start"],
        ),
    );

    offset = handle["copy"](
      audioBuffer,
      a,
      offset,
      {
        kind: "copy",
        segment: {
          start: beat["segment1"]["start"],
          end:
            beat["segment1"]["end"] -
            num_overlap_samples / audioBuffer.sampleRate, //TODO: prevent rounding error
        },
      },
      overlap,
    );

    //console.log(num_overlap_samples);
    for (var i = 0; i < num_overlap_samples; ++i) {
      var sample1L =
        bufferL[
          Math.floor(audioBuffer.sampleRate * beat["segment1"]["end"]) -
            num_overlap_samples +
            i
        ] * 32768.0;
      var sample1R =
        bufferR[
          Math.floor(audioBuffer.sampleRate * beat["segment1"]["end"]) -
            num_overlap_samples +
            i
        ] * 32768.0;
      var sample2L =
        bufferL[
          Math.floor(audioBuffer.sampleRate * beat["segment2"]["end"]) -
            num_overlap_samples +
            i
        ] * 32768.0;
      var sample2R =
        bufferR[
          Math.floor(audioBuffer.sampleRate * beat["segment2"]["end"]) -
            num_overlap_samples +
            i
        ] * 32768.0;

      //console.log(sample1L);
      var s2_weight = i / num_overlap_samples;

      var s1_scale = Math.pow(1 - s2_weight, 0.5);
      var s2_scale = Math.pow(s2_weight, 0.5);

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
  };

  return function (audioBuffer, hackData, progressCallback) {
    var inputFrameLength = audioBuffer.length,
      outputFrameLength = hackData["num_samples"],
      numberOfChannels = audioBuffer.numberOfChannels,
      sampleRate = audioBuffer.sampleRate,
      bitsPerSample = 16,
      byteRate = (sampleRate * numberOfChannels * bitsPerSample) / 8,
      blockAlign = (numberOfChannels * bitsPerSample) / 8,
      wavDataByteLength = outputFrameLength * numberOfChannels * 2,
      // 16-bit audio
      headerByteLength = 44,
      totalLength = headerByteLength + wavDataByteLength,
      waveFileData = new Uint8Array(totalLength),
      subChunk1Size = 16,
      // for linear PCM
      subChunk2Size = wavDataByteLength,
      chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

    var overlap = hackData["overlap"];
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
    var segments = hackData["segments"];
    var offset = 44;
    for (var i = 0; i < segments.length; i++) {
      //console.log("Loop #" + i);
      var fn = handle[segments[i]["kind"]];
      offset = fn(audioBuffer, waveFileData, offset, segments[i], overlap);
    }

    return waveFileData;
  };
})();
