# Music Hack Scripts
Lucas Garron  
<http://music.garron.us/hacks/>

Various scripts used for dance hacking at Stanford using the Echonest Remix API

## Usage
Requires Python and the [Echonest Remix API](https://code.google.com/p/echo-nest-remix/)

## Files

- `analyze/analyze.py` - Outputs the beats of a song to JSON (naïvely, but it works).
- `analyze/analyze.sh` - Outputs more complete info form Echonest.
- `beatcaster/beatcaster.py` - Reasonably clean way to recast beats by modifying their tempo.
- `blender/waltz_blender.py` - Blends beats to turn 4/4 songs into waltzes.
- `inception/inception.py` - Make everything into a mind heist.
- `tools/wz` - Automatically calls `analyze` and tries the most common waltzifications with waltz_blender

For some of this to work, the scrips have to be in the path, e.g. `waltz_blender.py` as `waltz_blender`.
