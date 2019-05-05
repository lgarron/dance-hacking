import {TimeStamp} from "../model"
import {App} from "./app"

export class Controller {
  constructor(private app: App) {
  }

  async loadSong(url: string) {
    console.log("load")
    // TODO: Lock class as "processing".
    await this.app.model.reset(url);
  }

  addSectionMarker(timeStamp: TimeStamp) {
    const preparation = this.app.model.preparation;
    console.log(preparation);
  }

  addBeatMarker(timeStamp: TimeStamp) {
    console.warn("Unimplemented: addBeatMarker")
  }
}
