import "./main.ts"
import {App} from "./app"
import KingChanticleer from "../audio/king-chanticleer.mp3"

window.addEventListener("load", function {
  const app = new App()
  window["app"] = app;
  document.body.appendChild(app.appView.element);
  app.loadSong(KingChanticleer)
})
