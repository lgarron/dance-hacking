import "./main.ts";
import { App } from "./app";
// @ts-ignore
import KingChanticleer from "url:../audio/king-chanticleer.mp3";

window.addEventListener("load", async () => {
  const app = new App();
  window["app"] = app;
  document.body.appendChild(app.view.element);
  await app.controller.loadSong(KingChanticleer);
  app.controller.addSectionMarker(0.1);
});
