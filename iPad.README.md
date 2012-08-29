# Dance Hacking on an iPad.

## Important Setup Steps

- Jailbreak and install Cydia. Install the following packages:
  - ffmpeg
  - OpenSSH (make sure to change passwords)
  - Python
  - cURL

From now on, it's much easier to SSH into the iPad, and use an SFTP client to upload files. Beware that the iPad won't have bsic commands like "man" and "unzip", or programs like "git" (unless you install them).

- Create the following folders:

mkdir /var/mobile/jb/
mkdir /var/mobile/jb/music
mkdir /var/mobile/jb/music/Music
mkdir /var/mobile/jb/music/Music/temp
mkdir /var/mobile/jb/music/Music/Archive
mkdir /var/mobile/jb/music/Music/Archive/temp
mkdir /var/mobile/jb/music/Music/Archive/links
mkdir /var/mobile/jb/music/Music/Archive/JSON

- Copy dance-hacking to /var/mobile/jb/music/dance-hacking
- cd to /var/mobile/jb/music/dance-hacking/ and run `./create_links` (you will get instructions about adding something to .bash_profile, but this is unnecessary.)

Copy iPad.bashrc to /var/mobile/.bashrc

## Usage

- Start a terminal app on the iPad
- Make sure you're in /var/mobile (e.g. using "pwd")
- Run the following (sample URL of "Twinkle, Twinkle, Little Star" by the ThePianoGuys included, because it's short and easy to hack):

  source .bashrc
  yt-wz http://www.youtube.com/watch?v=aDHxhhB8710