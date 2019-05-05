import {WorkspaceModel} from "./model"
import {AppView} from "./view"
import {Controller} from "./controller"

export class App {
  workspaceModel: WorkspaceModel = new WorkspaceModel();
  appView: AppView = new AppView();
  controller: Controller = new Controller;
  constructor() {

  }

  loadSong(url: string) {
    this.appView.playerView.setAudio(url)
  }
}
