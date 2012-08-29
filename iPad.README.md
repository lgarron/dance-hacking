# Dance Hacking on an iPad.

## Important Setup Steps

- Jailbreak and install Cydia. Install the following packages:
  - ffmpeg
  - OpenSSH (make sure to change passwords)
  - Python
  - cURL

From now on, it's much easier to SSH into the iPad, and use an SFTP client to upload files. Beware that the iPad won't have bsic commands like "man" and "unzip", or programs like "git" (unless you install them).

- Upload the entire contents of the dance-hacking folder to "/var/mobile/dance-hacking" on the iPad.
- Run "/var/mobile/dance-hacking/iPad.install.sh" in the iPad from the Terminal. This automates the entire install process.

## Usage

- Start a terminal app on the iPad
- Make sure you're in /var/mobile (e.g. using "pwd")
- Run the following (sample URL included here):

  source ~/.bashrc
  yt-wz http://www.youtube.com/watch?v=aDHxhhB8710