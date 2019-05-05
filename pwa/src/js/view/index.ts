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
  constructor() {
    super("section");
    this.element.textContent = "Hi, I'm a section!"
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
  preparationView = new PreparationView();
  masterpieceView = new MasterpieceView();
  constructor() {
    super("app");
    this.element.appendChild(this.preparationView.element);
    this.element.appendChild(this.masterpieceView.element);
  }
}

export class PreparationView extends View {
  sectionListView: SectionListView = new SectionListView();
  constructor() {
    super("preparation", "panel")
    this.element.appendChild(this.sectionListView.element);

    this.sectionListView.add(new SectionView());
    this.sectionListView.add(new SectionView());
  }
}


export class MasterpieceView extends View {
  constructor() {
    super("masterpiece", "panel")
  }
}
