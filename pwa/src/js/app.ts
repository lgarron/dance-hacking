import {WorkspaceModel} from "./model"
import {AppView} from "./view"
import {Controller} from "./controller"

export class App {
  model: WorkspaceModel = new WorkspaceModel(this);
  appView: AppView = new AppView(this);
  controller: Controller = new Controller(this);
}
