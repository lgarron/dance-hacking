# Music Hack Scripts
Lucas Garron  
<http://music.garron.us/hacks/>

Various scripts used for dance hacking at Stanford using the Echonest Remix API

## Files

- `wz` - Automatically calls `analyze` and tries the most common waltzifications with waltz_blender
- `analyze` - Uploads a song to Echonest and downloads a `.json file with the analysis.
- `waltz_blender` - Blends beats. By default, turns 4/4 songs into waltzes.
- `wz-beatcaster` - Reasonably clean way to recast beats by modifying their tempo.
- `inception` - Make everything into a mind heist.
- `yt-wz` - One step from YouTube to waltz.

For some of this to work, the scrips have to be in the path, e.g. `waltz_blender.py` as `waltz_blender`.

## Installation Cheat Sheet

### Windows

- Install [cygwin](http://cygwin.com/install.html)
  - Select the following packages: python, curl, zip, openssl
- Install CA Certificates the "Right" Way (section below)
- Quick Install (section below)
- Windows: Install ffmpeg (section below)
- Try one of the examples (section below)

### OSX

- Open Terminal and `cd` to a folder where you want to download the dance-hacking source permanently.
- Quick Install (section below)
- OSX: Install ffmpeg (section below)
- Try one of the examples (section below)

#### OSX Echonest (optional):

- Download and install the [Echonest Remix API](http://echonest.github.com/remix/)
  - OSX: Use the Echonest ffmpeg binary (section below)

### Quick Install

Please register and get an [Echonest API Key](https://developer.echonest.com/account/register).
(If you just want to try it, this install will work because I'm nice and I'm providing a default API key, but you should get your own.)

    curl -L "https://github.com/lgarron/dance-hacking/zipball/master" -o "dance-hacking.zip" &&
    unzip "dance-hacking.zip" &&
    mv $(ls . | grep "lgarron-dance-hacking") dance-hacking &&
    cd dance-hacking &&
    ./setup.sh &&
    . "${HOME}/.bash_profile"

### OSX: Fix Python version for Echonest 1.4

    function copy_to_python_2_7 {sudo cp -r "/Library/Python/2.6/site-packages/${1}" "/Library/Python/2.7/site-packages/${1}"}
    for i in "cAction.so" "dirac.so" "echonest" "pyechonest" "soundtouch.so" "The_Echo_Nest_Remix_API-1.4-py2.6.egg-info"; do copy_to_python_2_7 "${i}"; done

### OSX: Use the Echonest ffmpeg binary

    which ffmpeg
    if [ $? -eq 1 ]; then sudo ln -s /usr/local/bin/en-ffmpeg /usr/local/bin/ffmpeg; fi

### OSX: Install ffmpeg

    cd "${DANCE_HACKING_SOURCE_FOLDER}" &&
    mkdir -p "dl" &&
    curl -L "https://github.com/downloads/lgarron/dance-hacking/ffmpeg-osx.zip" -o "dl/ffmpeg-osx.zip" &&
    unzip "dl/ffmpeg-osx.zip" -d "lib" &&
    cd "symlinks" &&
    ln -s "../lib/en-ffmpeg" "ffmpeg" &&
    cd ..

### Windows: Install ffmpeg

    cd "${DANCE_HACKING_SOURCE_FOLDER}" &&
    mkdir -p "dl" &&
    curl -L "https://github.com/downloads/lgarron/dance-hacking/ffmpeg-windows.zip" -o "dl/ffmpeg-windows.zip" &&
    unzip "dl/ffmpeg-windows.zip" -d "lib" &&
    cd symlinks &&
    ln -s "../lib/ffmpeg.exe" "ffmpeg.exe" &&
    ln -s "../lib/pthreadGC2.dll" "pthreadGC2.dll" &&
    cd ..

### Examples

Waltzify an instrumental version of Adele's "Someone Like You" (30MB download, will produce 260MB of files, creates a folder in your Dance Hacking folder):

    yt-wz http://www.youtube.com/watch?v=L0jbjnqHFCU

Waltzify "Code Name Vivaldi" by ThePianoGuys (136MB download, will produce 340MB of files, creates a folder in your Dance Hacking folder):

    yt-wz http://www.youtube.com/watch?v=09RUuTAM2H0

Waltzify a file on your hard drive (creates a JSON analysis file and folder in the same directory as the file):

    cd path/to/folder/containing/your/file # Can ususally be dragged and dropped onto your Terminal window.
    wz "file-name.mp3"

Waltzify with a different beat pattern:

    cd path/to/folder/containing/your/file # Can ususally be dragged and dropped onto your Terminal window.
    analyze "file-name.mp3"
    wz "file-name.mp3" "file-name.mp3.json" "[12]34" # Good for redowa instead of cross-step, because 1 and 3 become the new downbeats 1 and 2

Waltzify by speeding up beats instead of blending (requires the remix API to be correctly installed):

    cd path/to/folder/containing/your/file # Can ususally be dragged and dropped onto your Terminal window.
    wz-beatcaster "file-name.mp3"

###  No CA Certificates Installed?

#### Install CA Certificates the "Right" Way

    if [ -z "$(curl-config --ca)" ] 
    then
        echo "No location for curl certificate."
    else
        if [ -f "$(curl-config --ca)" ]
        then
            echo "curl certificate already exists."
        else
            curl http://curl.haxx.se/ca/cacert.pem -o "$(curl-config --ca)"
        fi
    fi

#### Ignore CA Certificates: Quick & Dirty (Unsafe) Way

Place a file containing "insecure" at `~/.curlrc`.

Note that this will avoid checking for certificates *for all cURL downloads in the future*, without warning.
*Probably*, nothing bad will happen. Theoretically, very bad things could happen.

### Not using bash?

[Neither do I](https://github.com/robbyrussell/oh-my-zsh). I'm gonna assume you know what you're doing. :-P

## Dependencies

- ffmpeg
- Python
- cURL
- youtube-dl (included)

### Recommended Dependencies

- Echonest Remix API
- lame (allows for slightly better-quality .mp3 files due to VBR.)
- grep, zip/unzip (for more automated setup)
- OpenSSL (CA certs?)

### Optional Dependencies

- git (best installation, keeping up to date... if you know what you're doing)

## Tested On

- OSX (Mountain Lion)
- Windows XP (cygwin)
- iPad (using custom install)

## Other Considerations

- bpm-tap fo manual beat data.
- Allow lower-quality youtube-dl downloads.