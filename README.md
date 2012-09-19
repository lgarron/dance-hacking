# Music Hack Scripts
Lucas Garron  
<http://music.garron.us/hacks/>

Various scripts used for dance hacking at Stanford using the Echonest Remix API

## Usage
Requires Python and the [Echonest Remix API](https://code.google.com/p/echo-nest-remix/)

## Files

- `analyze/analyze.py` - Outputs the beats of a song to JSON (naïvely, but it works).
- `analyze/analyze_full.sh` - Outputs more complete info from Echonest.
- `beatcaster/beatcaster.py` - Reasonably clean way to recast beats by modifying their tempo.
- `blender/waltz_blender.py` - Blends beats to turn 4/4 songs into waltzes.
- `inception/inception.py` - Make everything into a mind heist.
- `tools/wz` - Automatically calls `analyze` and tries the most common waltzifications with waltz_blender

For some of this to work, the scrips have to be in the path, e.g. `waltz_blender.py` as `waltz_blender`.

## Installation Cheat Sheet

### Quick Install

    wget "https://github.com/lgarron/dance-hacking/zipball/master" -O "dance-hacking.zip" &&
    unzip "dance-hacking.zip" &&
    mv $(ls . | grep "lgarron-dance-hacking") dance-hacking &&
    cd dance-hacking &&
    ./setup.sh &&
    . ~/.bash_profile

#### Troubleshooting

    curl -L "https://github.com/lgarron/dance-hacking/zipball/master" -o "dance-hacking.zip"
    curl --insecure -L "https://github.com/lgarron/dance-hacking/zipball/master" -o "dance-hacking.zip"

### Fix Python version for Echonest 1.4 installation on OSX

    function copy_to_python_2_7 {sudo cp -r "/Library/Python/2.6/site-packages/${1}" "/Library/Python/2.7/site-packages/${1}"}
    for i in "cAction.so" "dirac.so" "echonest" "pyechonest" "soundtouch.so" "The_Echo_Nest_Remix_API-1.4-py2.6.egg-info"; do copy_to_python_2_7 "${i}"; done

### Use the Echonest binary as ffmpeg

    which ffmpeg
    if [ $? -eq 1 ]; then sudo ln -s /usr/local/bin/en-ffmpeg /usr/local/bin/ffmpeg; fi

## Dependencies

- ffmpeg
- Python
- cURL
- youtube-dl
- the Echonest Track API

### Optional Dependencies

- lame (optional, allows for slightly better-quality .mp3 files due to VBR.)
- wget, zip/unzip (optional, for easy setup.)

## Other Considerations

- Self-update `youtube-dl`.
- bpm-tap fo manual beat data.