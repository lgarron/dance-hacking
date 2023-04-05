# Music Hack Scripts
Lucas Garron  
<http://music.garron.us/hacks/>

Various scripts used for dance hacking at Stanford using the Echonest Remix API

## Files

- `wz` - Automatically calls `analyze` and tries the most common waltzifications with `waltz_blender`.
- `analyze` - Uploads a song to Echonest and downloads a `.json file with the analysis.
- `waltz_blender` - Blends beats. By default, turns 4/4 songs into waltzes.
- `wz-beatcaster` - Reasonably clean way to recast beats by modifying their tempo.
- `inception` - Make everything into a mind heist.
- `yt-wz` - One step from YouTube to waltz.

For some of this to work, the scrips have to be in the path, e.g. `waltz_blender.py` as `waltz_blender`.

## Installation Cheat Sheet

### Windows (Using Cygwin)

(Paste into cygwin is Shift-Insert.)

- Install [cygwin](http://cygwin.com/install.html)
  - Select the following packages: python, curl, zip, openssl
- Install CA Certificates the "Right" Way (section below)
- Quick Install (section below)
- Try one of the examples (section below)

### OSX

- Optional: Download and install the [Echonest Remix API](http://echonest.github.com/remix/)
- Open Terminal and copy: `cd /Applications`
- Quick Install (section below)
- Try one of the examples (section below)

### Linux

- Install curl and ffmpeg (requires password): sudo apt-get install curl ffmpeg
- Quick Install (section below)
- Try one of the examples (section below)

NOTE: This works for me in Ubuntu, but the output audio appears to be differently shifted. So, it "works", but maybe not quite as advertised.

### Quick Install

Please register and get an [Echonest API Key](https://developer.echonest.com/account/register).
(If you just want to try it, this install will work because I'm nice and I'm providing a default API key, but you should get your own.)

    curl -L "https://github.com/lgarron/dance-hacking/zipball/master" -o "dance-hacking.zip" &&
    unzip "dance-hacking.zip" &&
    mv $(ls . | grep "lgarron-dance-hacking") dance-hacking &&
    cd dance-hacking &&
    ./setup.sh &&
    . "${HOME}/.bash_profile"

### Examples

Waltzify an instrumental version of Adele's "Someone Like You" (30MB download, will produce 260MB of files, creates a folder in your "Dance Hacking" folder):

    yt-wz http://www.youtube.com/watch?v=L0jbjnqHFCU

Waltzify "Code Name Vivaldi" by ThePianoGuys (136MB download, will produce 340MB of files, creates a folder in your "Dance Hacking" folder):

    yt-wz http://www.youtube.com/watch?v=09RUuTAM2H0

Waltzify a file on your hard drive (creates a JSON analysis file and folder in the same directory as the file):

    cd path/to/folder/containing/your/file
    wz "file-name.mp3" # Can also be any other audio/video format.

Or simply:

 cd "path/to/file-name.mp3" # Can ususally be dragged and dropped onto your Terminal window.

Waltzify with a different beat pattern (this example is good for creating a redowa with downbeats 1 and 3 moved to 1 and 2):

    cd path/to/folder/containing/your/file
    analyze "file-name.mp3"
    wz "file-name.mp3" "file-name.mp3.json" "[12]34"

Convert a waltz to 5/4 time:

    cd path/to/folder/containing/your/file
    analyze "file-name.mp3"
    wz "file-name.mp3" "file-name.mp3.json" "1234[56]"

Waltzify by speeding up beats instead of blending (requires the Echonest Remix API to be installed correctly):

    cd path/to/folder/containing/your/file
    your Terminal window.
    wz-beatcaster "file-name.mp3"

Advanced waltz_blender use:

    cd path/to/folder/containing/your/file
    analyze file-name.mp3
    wavify file-name.mp3
    waltz_blender file-name.mp3.wav file-name.mp3.json "1[24][52][36]" 50 0 6

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

### Default shell is not bash?

[Neither is mine](https://github.com/robbyrussell/oh-my-zsh). I'm gonna assume you know what you're doing. :-P  
(If your default shell is something like tcsh, then... happy hacking? :-)

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

- git (for keeping the repo up to date... if you know what you're doing)

## Tested On

- OSX (Mountain Lion)
- Windows XP (cygwin)
- Linux (Ubuntu)
- iPad (using custom install)

## Other Considerations

- bpm-tap fo manual beat data.
- Allow lower-quality youtube-dl downloads.
- Allow for easy use of tatums instead of beats.
- Integrate better with actual Echonest Remix API.