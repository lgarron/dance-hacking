import {App} from "../app"

export type TimeStamp = number

export interface Beat {
  start: TimeStamp
  end: TimeStamp
}

export interface Section {
  start: TimeStamp
  end: TimeStamp
  beats?: Beat[]
}

export class Preparation {
  sections: Section[] = []
}

export class WorkspaceModel {
  audioURL?: string = null
  preparation: Preparation = new Preparation()
  constructor(private app: App) {
  }

  async reset(url?: string): Promise<void> {
    this.audioURL = url
    this.preparation = new Preparation();

    const playerView = this.app.appView.playerView;

    await playerView.setAudio(url);
    this.preparation.sections.push({
      start: 0,
      end: playerView.audio.duration
    })
  }
}
