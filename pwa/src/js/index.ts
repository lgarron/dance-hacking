import "./main.ts"
import {App} from "./app"
import KingChanticleer from "../audio/king-chanticleer.mp3"

window.addEventListener("load", async function {
  const app = new App()
  window["app"] = app;
  document.body.appendChild(app.view.element);
  await app.controller.loadSong(KingChanticleer)
  app.controller.addSectionMarker(0.10)
})
