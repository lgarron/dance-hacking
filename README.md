# Music Hack Scripts
Lucas Garron  
<http://music.garron.us/hacks/>

Various scripts used for dance hacking at Stanford using the Echonest Remix API

## Usage
Requires Python and the [Echonest Remix API](https://code.google.com/p/echo-nest-remix/)

## Files

- `analyze/analyze.py` - Outputs the beats of a song to JSON (naïvely, but it works).
- `blender/waltz_blender.py` - Blends beats to turn 4/4 songs into waltzes.
- `blender/wz` - Automatically calls `analyze` and tries the most common waltzifications.
- `beatcaster.py` - Reasonably clean way to recast beats.