import {Section} from "../model"

class View {
  element: HTMLElement
  constructor(tag: string, className?: string) {
    this.element = document.createElement(tag);
    if (className) {
      this.element.classList.add(className);
    }
  }
}

export class SectionView extends View {
  constructor(public section: Section) {
    super("section");
    this.element.textContent = `Section (${section.start} — ${section.end})`
  }
}

export class SectionListView extends View {
  sectionViews: SectionView[] = []
  constructor() {
    super("section-list")
  }

  add(sectionView: SectionView) {
    this.sectionViews.push(sectionView)
    this.element.appendChild(sectionView.element);
  }
}

export class AppView extends View {
  playerView = new PlayerView();
  preparationView = new PreparationView();
  masterpieceView = new MasterpieceView();
  constructor() {
    super("app");
    this.element.appendChild(this.playerView.element);
    this.element.appendChild(this.preparationView.element);
    this.element.appendChild(this.masterpieceView.element);
  }
}

export class PlayerView extends View {
  audio: HTMLAudioElement = new Audio();
  constructor() {
    super("player");
    this.element.appendChild(this.audio);
    this.audio.setAttribute("controls", "");
    this.audio.setAttribute("preload", "yes");
  }

  setAudio(url: string) {
    this.audio.src = url
  }
}

export class PreparationView extends View {
  sectionListView: SectionListView = new SectionListView();
  constructor() {
    super("preparation", "panel")
    this.element.appendChild(this.sectionListView.element);

    this.sectionListView.add(new SectionView({
      start: 0,
      end: 4.51,
      beats: []
    }));
    this.sectionListView.add(new SectionView({
      start: 4.51,
      end: 20.00,
      beats: []
    }));
  }
}


export class MasterpieceView extends View {
  constructor() {
    super("masterpiece", "panel")
  }
}
