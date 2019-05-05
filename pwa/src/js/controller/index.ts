import {TimeStamp, Section} from "../model"
import {App} from "./app"

class Lock {
  message?: string = null;

  check(message: string) {
    if (!!this.message) {
      throw `Controller was already locked (${this.message}) while trying to perform an action (${message}).`
    }
  }

  lock(message: string) {
    this.check(message);
    this.message = message
  }

  unlock() {
    if (!this.message) {
      throw "Tried to unlock a controller that was not locked!";
    }
    this.message = null
  }
}

export class Controller {
  private lock: Lock = new Lock();
  constructor(private app: App) {}

  // TODO: Allow terminating a pending song load?
  async loadSong(url: string) {
    this.lock.lock("loading song");
    await this.app.model.reset(url);
    this.lock.unlock();
  }

  addSectionMarker(timeStamp: TimeStamp) {
    this.lock.check("adding section marker")
    this.app.model.addSectionMarker(timeStamp)
  }

  addSectionMarkerNow() {
    this.lock.check("adding section to current timestamp")
    this.app.model.addSectionMarkerNow()
  }

  addBeatMarker(timeStamp: TimeStamp) {
    this.lock.check("adding beat marker")
    console.warn("Unimplemented: addBeatMarker")
  }
}
