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

    const playerView = this.app.view.playerView;

    await playerView.setAudio(url);
    const newSection = {
      start: 0,
      end: playerView.audio.duration
    };
    this.preparation.sections.push(newSection)
    this.app.view.preparationView.sectionListView.add(newSection)
  }

  addSectionMarker(timeStamp: TimeStamp) {
    const sections = this.app.model.preparation.sections;
    var i = 0;
    while (i < sections.length && timeStamp > sections[i].end) {
      i++;
    }
    console.log(i);
    const newSection = {
      start: timeStamp,
      end: sections[i].end
    }
    sections[i].end = timeStamp;
    sections.splice(i + 1, 0, newSection);
    this.app.view.preparationView.sectionListView.split(i, newSection)
  }

  addSectionMarkerNow() {
    console.log(this.app.view.playerView.audio.currentTime)
    this.addSectionMarker(this.app.view.playerView.audio.currentTime)
  }
}
