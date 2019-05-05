import {App} from "../app"

export type TimeStamp = number

export interface Beat {
  start: TimeStamp
  end: TimeStamp
}

export interface Section {
  start: TimeStamp
  end: TimeStamp
  beats: Beat[]
}

export class Preparation {
  sections: Section[] = []
}

export class WorkspaceModel {
  audioUrl: string
  preparation: Preparation = new Preparation();
  constructor(private app: App) {

  }

  setAudioURL(url: string) {
    this.audioUrl = url;
    this.app.appView.playerView.setAudioURL(url);
  }
}
