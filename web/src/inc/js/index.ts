type SongBeatData = any[];

interface StoredSongData {
  fileName: string;
  beats?: SongBeatData;
}

type Milliseconds = number;

async function hashFile(file: File): Promise<string> {
  return buf2hex(
    await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
  );
}

class SongData {
  private constructor(
    public file: File,
    public localStorageKey: string,
    public displayElem: HTMLTextAreaElement,
    public songData: StoredSongData,
  ) {
    this.updateDisplay();
  }

  static async fromFile(
    file: File,
    displayElem: HTMLTextAreaElement,
  ): Promise<SongData> {
    const hash = await hashFile(file);
    const localStorageKey = `song-${hash}`;
    const storedData = localStorage[localStorageKey];
    const songData: StoredSongData = storedData
      ? JSON.parse(storedData)
      : {
          fileName: file.name,
          beats: [],
        };
    return new SongData(file, localStorageKey, displayElem, songData);
  }

  async store(): Promise<void> {
    localStorage[this.localStorageKey] = JSON.stringify(this.songData);
  }

  updateDisplay() {
    this.displayElem.textContent = JSON.stringify(this.songData.beats);
  }

  addBeat(timestamp: Milliseconds) {
    this.songData.beats.push([timestamp]);
    this.updateDisplay();
    this.persistData();
  }

  clearBeats() {
    this.songData.beats = [];
    this.persistData();
  }

  // Pass (-1, 1) to delete the last beat.
  deleteBeats(i: number, n: number) {
    this.songData.beats.splice(i, n);
    this.persistData();
  }

  lastBeatTimestamp(): Milliseconds {
    return (this.songData.beats.at(-1) ?? [0])[0];
  }

  setData(data: StoredSongData): void {
    this.songData = data;
    this.persistData();
  }

  persistData() {
    this.updateDisplay();
    this.store(); // TODO: debounce
  }
}

function button(selector: string): HTMLButtonElement {
  return document.querySelector(selector) as HTMLButtonElement;
}

function buttonListener(selector: string, listner: () => void): void {
  button(selector).addEventListener("click", listner);
}

function fileInputListener(selector: string, callback: (file: File) => void) {
  const elem = document.querySelector(selector) as HTMLInputElement;
  elem.addEventListener("change", async () => {
    const newFile = elem.files?.[0];
    if (newFile) {
      callback(newFile);
    }
  });
}

const originalAudioElem = document.querySelector(
  "#original_audio",
) as HTMLAudioElement;

const outputAudioElem = document.getElementById(
  "output_audio",
)! as HTMLAudioElement;

class App {
  songInputElem = document.querySelector("#song_input") as HTMLInputElement;
  originalAudioElem = originalAudioElem;
  beatListElem = document.querySelector("#beat_list") as HTMLTextAreaElement;

  songData?: SongData;

  constructor() {
    fileInputListener("#song_input", async (file: File) => {
      this.setSongData(await SongData.fromFile(file, this.beatListElem));
    });

    buttonListener("#add_beat", () =>
      this.songData.addBeat(this.originalAudioElem.currentTime),
    );

    buttonListener("#rewind_beats", () => {
      this.songData.deleteBeats(-4, 4);
      this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
      button("#add_beat").focus();
    });

    buttonListener("#clear_beats", () => this.songData.clearBeats());
    buttonListener("#play_from_final_beat", () => {
      this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
      outputAudioElem.pause();
      this.originalAudioElem.play();
      button("#add_beat").focus();
    });

    buttonListener("#save_beats", () => {
      const songData = this.songData.songData!;
      console.log({ songData });
      const buffer = new TextEncoder().encode(JSON.stringify(songData));
      const url = URL.createObjectURL(
        new Blob([buffer], { type: "text/plain" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${songData.fileName} (${songData.beats.length} beats).json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    fileInputListener("#load_beats", async (file: File) => {
      this.songData!.setData(JSON.parse(await file.text()));
    });

    buttonListener("#hack", () => {
      current_hack.file = this.songData!.file;
      current_hack.audio_analysis = this.songData!.songData.beats;
      startHack();
    });
  }

  async setSongData(songData: SongData) {
    this.songData = songData;
    this.originalAudioElem.src = URL.createObjectURL(songData.file);
    document
      .querySelectorAll(".song-enables")
      .forEach((elem: HTMLInputElement) => (elem.disabled = false));
  }
}

function buf2hex(buffer: ArrayBuffer): string {
  // buffer is an ArrayBuffer
  return (
    Array.prototype.map.call(new Uint8Array(buffer), (x: number) =>
      `00${x.toString(16)}`.slice(-2),
    ) as string[]
  ).join("");
}

(window as any).app = new App();

/******** old code ********/

import { saveAs } from "../lib/FileSaver.js";
import { FileAPIReader, getAllTags, loadTags, Base64 } from "../lib/id3.js";
import { hackData } from "./beatcaster";
import { current_hack } from "./current_hack";
import { registerFileDragDrop } from "./drag-drop-file";
import { createWaveFileData } from "./wav";

function displayString(str) {
  console.log(str);
  // document.querySelector("#output_bpm")!.textContent = str;
  // .stop().fadeOut(0).html(str).fadeIn(100); // TODO
}

function saveFile() {
  console.log(current_hack.file);
  let fileName = current_hack.downloadFileName;
  if (fileName === "") {
    fileName = "Song";
  }
  const extension = ".wav";
  saveAs(current_hack.blob, fileName + extension);
}

function rehack() {
  current_hack.file && startHack();
}

function display_analysis(audio_analysis) {
  document
    .querySelector("#output_text")!
    .setAttribute("value", JSON.stringify(audio_analysis, null, 2));
  // .fadeOut(0)
  // .fadeIn(400); // TODO
  // document.querySelector("#analysis_title").html(audio_analysis.meta.title);
  // var time = "" + Math.floor(audio_analysis.meta.seconds/60) + ":" + Math.floor((audio_analysis.meta.seconds % 60)/10) + Math.floor(audio_analysis.meta.seconds % 10);
  // document.querySelector("#analysis_time").html(time);
  // document.querySelector("#analysis_artist").html(audio_analysis.meta.artist);
  // document.querySelector("#analysis_album").html(audio_analysis.meta.album);
  // document.querySelector("#analysis_bpm").html(Math.round(audio_analysis.track.tempo)) ;
  // var keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // document.querySelector("#analysis_key").html(keys[audio_analysis.track.key]);
  // var modes = ["Minor", "Major"];
  // document.querySelector("#analysis_mode").html(modes[audio_analysis.track.mode]);
  // document.querySelector("#analysis_bpm_confidence").html(Math.round(audio_analysis.track.tempo_confidence * 100));
  // document.querySelector("#analysis_key_confidence").html(Math.round(audio_analysis.track.key_confidence * 100));
  // document.querySelector("#analysis_mode_confidence").html(Math.round(audio_analysis.track.mode_confidence * 100));
  document.getElementById("analysis_info")!.classList.remove("hidden");
}

function hackSong(data) {
  const context = new AudioContext();
  context.decodeAudioData(
    data,
    function (buffer) {
      current_hack.hack_data = hackData(
        buffer,
        current_hack.audio_analysis,
        (document.getElementById("beat_pattern")! as HTMLInputElement).value,
        parseInt(
          (document.getElementById("overlap")! as HTMLInputElement).value,
        ) / 100,
        (document.getElementById("beat_type_tatums")! as HTMLInputElement)
          .checked,
      );

      const w = createWaveFileData(buffer, current_hack.hack_data);
      current_hack.blob = new Blob([w]);
      const hackedSongBlobURL = webkitURL.createObjectURL(current_hack.blob);

      // Update UI

      // document
      //   .getElementById("download_button_div")!
      //   .classList.remove("hidden");
      (
        document.getElementById("download_button") as HTMLButtonElement
      ).disabled = false;
      document
        .getElementById("download_button")!
        .addEventListener("click", saveFile);

      outputAudioElem.src = hackedSongBlobURL;
      if (
        (document.getElementById("autoplay_hack")! as HTMLInputElement).checked
      ) {
        originalAudioElem.pause();
        outputAudioElem.play();
      }
      //displayString("Hacked version of \"" + current_hack.audio_analysis.meta.title + "\" is playing.");
      // document.getElementById("new_song")!.classList.add("hidden");
      // document.getElementById("song_json")!.classList.add("hidden");
      // document.getElementById("output_bpm")!.classList.add("hidden");

      // document
      //   .getElementById("rehack_button")!
      //   .addEventListener("click", rehack);
    },
    function (e) {
      displayString("Failed to decode audio file (unknown reason). :-(");
      console.log(e);
    },
  );
}

function processAnalysis(audio_analysis) {
  current_hack.audio_analysis = audio_analysis;
  // display_analysis(audio_analysis);
  // displayString("BPM of \"" + audio_analysis.meta.title + "\" is: " + audio_analysis.track.tempo + "<br>(confidence: " + Math.round(100 * audio_analysis.track.tempo_confidence) + "%)");
  displayString("Please wait a moment for waltzification.");

  const reader = new FileReader();

  reader.onload = function (fileEvent) {
    hackSong(fileEvent.target!.result);
  };

  reader.readAsArrayBuffer(current_hack.file);
}

// From http://web.ist.utl.pt/antonio.afonso/www.aadsm.net/libraries/id3/index.js
// Used at http://web.ist.utl.pt/antonio.afonso/www.aadsm.net/libraries/id3/
// See original demo at https://github.com/aadsm/JavaScript-ID3-Reader/issues/3
function setBackground(file) {
  console.log("Loading ID3 tags.");
  const url = file.urn || file.name;
  const reader = new FileAPIReader(file);
  loadTags(
    url,
    function () {
      console.log("Loaded ID3 tags.");
      const tags = getAllTags(url);
      const image = tags.picture;
      if (typeof image !== "undefined") {
        document.body.style.background = `data:${
          image.format
        };base64,${Base64.encodeBytes(image.data)}`;
      } else {
        console.log("No image.");
      }
    },
    {
      tags: ["picture"],
      dataReader: reader,
    },
  );
}

function startHackSong(file) {
  current_hack.file = file;
  startHack();
}
async function startHackJSON(file) {
  current_hack.audio_analysis = JSON.parse(await file.text());
  startHack();
}

function startHack() {
  if (!(current_hack.file && current_hack.audio_analysis)) {
    return;
  }

  try {
    setBackground(current_hack.file);
  } catch (e) {
    console.log(e);
  }

  processAnalysis(current_hack.audio_analysis);
}

// registerFileDragDrop(
//   document.getElementById("new_song")!,
//   document.getElementById("new_song")!,
//   startHackSong,
// );
// registerFileDragDrop(
//   document.getElementById("song_json")!,
//   document.getElementById("song_json")!,
//   startHackJSON,
// );
