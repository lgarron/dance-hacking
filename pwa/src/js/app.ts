import {WorkspaceModel} from "./model"
import {AppView} from "./view"
import {Controller} from "./controller"

export class App {
  model: WorkspaceModel = new WorkspaceModel(this);
  view: AppView = new AppView(this);
  controller: Controller = new Controller(this);
}
