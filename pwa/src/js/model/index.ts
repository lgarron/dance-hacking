export type TimeStamp = number

export interface Beat {
  start: TimeStamp
  end: TimeStamp
}

export interface Section {
  parts: Beat[]
}
