type TimeStamp = number

interface Beat {
  start: TimeStamp
  end: TimeStamp
}

interface Section {
  parts: Beat[]
}
