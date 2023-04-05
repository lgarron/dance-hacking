type SongBeatData = any[];

interface StoredSongData {
  name: string;
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
    public beats: SongBeatData,
  ) {
    this.reloadBeats();
    this.updateDisplay();
  }

  static async fromFile(
    file: File,
    displayElem: HTMLTextAreaElement,
  ): Promise<SongData> {
    const hash = await hashFile(file);
    const localStorageKey = `song-${hash}`;
    const beats = JSON.parse(localStorage[localStorageKey] ?? "[]");
    return new SongData(file, localStorageKey, displayElem, beats);
  }

  async store(): Promise<void> {
    const storedData: StoredSongData = {
      name: this.file.name,
      beats: this.beats,
    };
    localStorage[this.localStorageKey] = JSON.stringify(storedData);
  }

  // TODO: validate data?
  reloadBeats() {
    this.beats =
      JSON.parse(localStorage[this.localStorageKey] ?? "{}").beats ?? [];
    this.updateDisplay();
  }

  updateDisplay() {
    this.displayElem.textContent = JSON.stringify(this.beats);
  }

  addBeat(timestamp: Milliseconds) {
    this.beats.push([timestamp]);
    this.updateDisplay();
    this.persistBeats();
  }

  clearBeats() {
    this.beats = [];
    this.persistBeats();
  }

  // Pass (-1, 1) to delete the last beat.
  deleteBeats(i: number, n: number) {
    this.beats.splice(i, n);
    this.persistBeats();
  }

  persistBeats() {
    this.updateDisplay();
    this.store(); // TODO: debounce
  }

  lastBeatTimestamp(): Milliseconds {
    return (this.beats.at(-1) ?? [0])[0];
  }
}

function button(selector: string): HTMLButtonElement {
  return document.querySelector(selector) as HTMLButtonElement;
}

class App {
  songInputElem = document.querySelector("#song_input") as HTMLInputElement;
  originalAudioElem = document.querySelector(
    "#original_audio",
  ) as HTMLAudioElement;
  beatListElem = document.querySelector("#beat_list") as HTMLTextAreaElement;
  addBeatInput = button("#add_beat");
  rewindBeatsElem = button("#rewind_beats");
  clearBeatsElem = button("#clear_beats");
  playFromFinalBeatElem = button("#play_from_final_beat");

  songData?: SongData;

  constructor() {
    this.songInputElem.addEventListener("change", async () => {
      const newSongFile = this.songInputElem.files?.[0];
      if (newSongFile) {
        this.setSongData(
          await SongData.fromFile(newSongFile, this.beatListElem),
        );
      }
    });

    this.addBeatInput.addEventListener("click", () =>
      this.songData.addBeat(this.originalAudioElem.currentTime),
    );

    this.rewindBeatsElem.addEventListener("click", () => {
      this.songData.deleteBeats(-4, 4);
      this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
    });

    this.clearBeatsElem.addEventListener("click", () =>
      this.songData.clearBeats(),
    );
    this.playFromFinalBeatElem.addEventListener("click", () => {
      this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
      this.originalAudioElem.play();
    });
  }

  async setSongData(songData: SongData) {
    this.songData = songData;
    this.originalAudioElem.src = URL.createObjectURL(songData.file);
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
  document.querySelector("#output_bpm")!.textContent = str;
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

      document
        .getElementById("download_button_div")!
        .classList.remove("hidden");
      document
        .getElementById("download_button")!
        .addEventListener("click", saveFile);

      const outputAudioElem = document.getElementById(
        "output_audio",
      )! as HTMLAudioElement;
      outputAudioElem.src = hackedSongBlobURL;
      if (
        (document.getElementById("autoplay_hack")! as HTMLInputElement).checked
      ) {
        outputAudioElem.play();
      }
      //displayString("Hacked version of \"" + current_hack.audio_analysis.meta.title + "\" is playing.");
      document.getElementById("new_song")!.classList.add("hidden");
      document.getElementById("song_json")!.classList.add("hidden");
      document.getElementById("output_bpm")!.classList.add("hidden");

      document
        .getElementById("rehack_button")!
        .addEventListener("click", rehack);
    },
    function (e) {
      displayString("Failed to decode audio file (unknown reason). :-(");
      console.log(e);
    },
  );
}

function processAnalysis(audio_analysis) {
  current_hack.audio_analysis = audio_analysis;
  display_analysis(audio_analysis);
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

registerFileDragDrop(
  document.getElementById("new_song")!,
  document.getElementById("new_song")!,
  startHackSong,
);
registerFileDragDrop(
  document.getElementById("song_json")!,
  document.getElementById("song_json")!,
  startHackJSON,
);
