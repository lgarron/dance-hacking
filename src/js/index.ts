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
      : ({
          fileName: file.name,
          beats: [],
          formatVersion: 1,
        } satisfies StoredSongData);
    return new SongData(file, localStorageKey, displayElem, songData);
  }

  async store(): Promise<void> {
    localStorage[this.localStorageKey] = JSON.stringify(this.songData);
  }

  updateDisplay() {
    const beats = this.songData.beats;
    const avg_bpm =
      beats.length > 2
        ? ` (${
            Math.round(
              (((beats.length - 2) * 60) /
                (beats.at(-1)![0] - beats.at(0)![0])) *
                10,
            ) / 10
          } average bpm)`
        : "";
    this.displayElem.textContent = `${beats.length} beats${avg_bpm}
${JSON.stringify(beats)}`;
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

export interface CurrentHack {
  hack_data?: HackData;
  audio_analysis?: SongBeatData;
  blob?: Blob;
  file?: File;
  downloadFileName?: string;
}
class App {
  songInputElem = document.querySelector("#song_input") as HTMLInputElement;
  originalAudioElem = originalAudioElem;
  beatListElem = document.querySelector("#beat_list") as HTMLTextAreaElement;

  songData?: SongData;

  currentHack: CurrentHack = {};

  constructor() {
    const onFileCallback = async (file: File) => {
      this.setSongData(await SongData.fromFile(file, this.beatListElem));

      try {
        setBackground(file);
      } catch (e) {
        console.log(e);
      }
    };
    fileInputListener("#song_input", onFileCallback);
    registerFileDragDrop(document.body, (file: File) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const fileList = dataTransfer.files;

      document.querySelector<HTMLInputElement>("#song_input")!.files = fileList;
      onFileCallback(file);
    }, document.querySelector<HTMLSpanElement>("#drag_drop_feedback")!);

    buttonListener("#add_beat", () => {
      if (this.songData) {
        this.songData.addBeat(this.originalAudioElem.currentTime);
      }
    });

    buttonListener("#rewind_4_beats", () => {
      if (this.songData) {
        this.songData.deleteBeats(-4, 4);
        this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
      }
      button("#add_beat").focus();
    });

    buttonListener("#rewind_1_beat", () => {
      if (this.songData) {
        this.songData.deleteBeats(-1, 1);
        this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
      }
      button("#add_beat").focus();
    });

    buttonListener("#clear_beats", () => {
      if (this.songData) {
        this.songData.clearBeats();
      }
    });
    buttonListener("#play_from_final_beat", () => {
      if (this.songData) {
        this.originalAudioElem.currentTime = this.songData.lastBeatTimestamp();
      }
      outputAudioElem.pause();
      this.originalAudioElem.play();
      button("#add_beat").focus();
    });

    buttonListener("#save_beats", () => this.downloadSongData());

    fileInputListener("#load_beats", async (file: File) => {
      if (this.songData) {
        let parsed = JSON.parse(await file.text());
        if (Array.isArray(parsed)) {
          parsed = {
            fileName: this.songData.file.name,
            beats: parsed,
            formatVersion: 1,
          } satisfies StoredSongData;
        }
        this.songData.setData(parsed);
      }
    });

    buttonListener("#hack", () => {
      this.currentHack.file = this.songData!.file;
      this.currentHack.audio_analysis = this.songData!.songData.beats;

      processAnalysis(this.currentHack);
    });
  }

  downloadSongData() {
    if (this.songData) {
      const songData = this.songData.songData!;
      const buffer = new TextEncoder().encode(JSON.stringify(songData));
      const url = URL.createObjectURL(
        new Blob([buffer], { type: "text/plain" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${songData.fileName} (${songData.beats.length} beats).json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async setSongData(songData: SongData) {
    this.songData = songData;
    this.originalAudioElem.src = URL.createObjectURL(songData.file);
    document
      .querySelectorAll<HTMLInputElement>(".song-enables")
      .forEach((elem: HTMLInputElement) => {
        elem.disabled = false;
      });
  }
}

function buf2hex(buffer: ArrayBuffer): string {
  return (
    Array.prototype.map.call(new Uint8Array(buffer), (x: number) =>
      `00${x.toString(16)}`.slice(-2),
    ) as string[]
  ).join("");
}

const app = new App();
// biome-ignore lint/suspicious/noExplicitAny: This is for debuggin'
(window as any).app = app;

/******** old code ********/

import { Base64, FileAPIReader, getAllTags, loadTags } from "../vendor/id3";
import { hackData } from "./beatcaster";
import { registerFileDragDrop } from "./drag-drop-file";
import type {
  HackData,
  Milliseconds,
  SongBeatData,
  StoredSongData,
} from "./types";
import { createWaveFileData } from "./wav";

function displayString(str: string) {
  console.log(str);
}

function saveFile(currentHack: CurrentHack) {
  console.log(currentHack.file);
  let fileName = currentHack.downloadFileName;
  if (fileName === "") {
    fileName = "Song";
  }
  const extension = ".wav";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(currentHack.blob!);
  a.download = fileName + extension;
  a.click();
  URL.revokeObjectURL(a.href);
}

function hackSong(currentHack: CurrentHack, data: ArrayBuffer) {
  const context = new AudioContext();
  context.decodeAudioData(
    data,
    (buffer) => {
      currentHack.hack_data = hackData(
        currentHack,
        buffer,
        (document.getElementById("beat_pattern")! as HTMLInputElement).value,
        parseInt(
          (document.getElementById("overlap")! as HTMLInputElement).value,
        ) / 100,
      );

      const w = createWaveFileData(buffer, currentHack.hack_data);
      currentHack.blob = new Blob([w], { type: "audio/wav" });
      const hackedSongBlobURL = webkitURL.createObjectURL(currentHack.blob);
      (
        document.getElementById("download_button") as HTMLButtonElement
      ).disabled = false;
      document
        .getElementById("download_button")!
        .addEventListener("click", () => saveFile(currentHack));

      outputAudioElem.src = hackedSongBlobURL;
      if (
        (document.getElementById("autoplay_hack")! as HTMLInputElement).checked
      ) {
        originalAudioElem.pause();
        outputAudioElem.play();
      }
    },
    function (e) {
      displayString("Failed to decode audio file (unknown reason). :-(");
      console.log(e);
    },
  );
}

function processAnalysis(currentHack: CurrentHack) {
  displayString("Please wait a moment for waltzification.");

  const reader = new FileReader();

  reader.onload = function (fileEvent) {
    hackSong(currentHack, fileEvent.target!.result as ArrayBuffer);
  };

  reader.readAsArrayBuffer(currentHack.file!);
}

interface ID3ImageData {
  format: string;
  data: Array<number>;
}

function loadImageFromID3(file: File): Promise<ID3ImageData | undefined> {
  // TODO: how can we catch errors?
  const {
    promise,
    resolve,
    reject: _,
  } = Promise.withResolvers<ID3ImageData | undefined>();
  const reader = new FileAPIReader(file);
  const url = file.name;
  loadTags(
    url,
    function () {
      console.log("Loaded ID3 tags.");
      const tags = getAllTags(url);
      resolve(tags.picture);
    },
    {
      tags: ["picture"],
      dataReader: reader,
    },
  );
  return promise;
}

async function setBackground(file: File) {
  console.log("Loading ID3 tags.");
  const image = await loadImageFromID3(file);
  if (typeof image !== "undefined") {
    const base64 = `data:${
      image.format
    };base64,${Base64.encodeBytes(image.data)}`;
    document.body.style.backgroundImage = `url(${JSON.stringify(base64)})`;
  } else {
    console.log("No image.");
  }
}
