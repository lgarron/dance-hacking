export type TimeStamp = number

export interface Beat {
  start: TimeStamp
  end: TimeStamp
}

export interface Section {
  start: TimeStamp
  end: TimeStamp
  beats: Beat[]
}

export class Preparation {
  sections: Section[] = []
}

export class WorkspaceModel {
  preparation: Preparation = new Preparation();
}
