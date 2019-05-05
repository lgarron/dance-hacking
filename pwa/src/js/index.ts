import "./main.ts"
import {AppView, SectionView, SectionListView} from "./view"

window.addEventListener("load", function {
  const appView = new AppView()
  window["appView"] = appView;
  document.body.appendChild(appView.element);
})
