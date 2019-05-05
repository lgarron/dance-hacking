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
  constructor(private section: Section) {
    super("section");
    this.update();
  }

  update() {
    this.element.textContent = `Section (${this.section.start} — ${this.section.end})`
  }
}

export class SectionListView extends View {
  sectionViews: SectionView[] = []
  constructor() {
    super("section-list")
  }

  add(section: Section) {
    const newSectionView = new SectionView(section);
    this.sectionViews.push(newSectionView)
    this.element.appendChild(newSectionView.element);
  }

  // Tell the section at the old index to update (i.e. it should update to
  // reflect changes in its model), and add the new section after it.
  split(oldIndex: number, newSection: Section) {
    const oldSectionView = this.sectionViews[oldIndex];
    oldSectionView.update();

    const newSectionView = new SectionView(newSection);
    this.sectionViews.splice(oldIndex + 1, 0, newSectionView);
    oldSectionView.element.insertAdjacentElement("afterend", newSectionView.element);
  }

  reset(sections: Section[] = []) {
    this.element.textContent = "";
    this.sectionViews = [];
    for (const section of sections) {
      this.add(section);
    }

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
  private resolve: () => void
  constructor() {
    super("player");
    this.element.appendChild(this.audio);
    this.audio.setAttribute("controls", "");
    this.audio.setAttribute("preload", "yes");
    this.audio.addEventListener("loadedmetadata", this.loadedmetadata.bind(this))
  }

  // TODO: Why can't the return type be `Promise<void>`?s
  async setAudio(url: string): Promise<{}> {
    const promise = new Promise(this.promise.bind(this));
    this.audio.src = url;
    return promise;
  }

  private promise(resolve: () => void, reject: (Error) => void): void {
      this.resolve = resolve
  }

  private loadedmetadata() {
    this.resolve()
  }
}

export class PreparationView extends View {
  sectionListView: SectionListView = new SectionListView();
  constructor() {
    super("preparation", "panel")
    this.element.appendChild(this.sectionListView.element);
  }
}


export class MasterpieceView extends View {
  constructor() {
    super("masterpiece", "panel")
  }
}
