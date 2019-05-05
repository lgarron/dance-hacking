import {TimeStamp, WorkspaceModel} from "../model"
import {App} from "./app"

export class Controller {
  constructor(private app: App) {
  }

  loadSong(url: string) {
    console.log(url)
    this.app.workspaceModel.setAudioURL(url);
  }

  addSectionMarker(timeStamp: TimeStamp) {

  }

  addBeatMarker(timeStamp: TimeStamp) {
    console.warn("Unimplemented: addBeatMarker")
  }
}
