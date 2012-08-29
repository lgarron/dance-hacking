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

- If you have control over some URL on the internet, you can use yt-wz-auto instead, which will look at the URL for what file to download. This can be very useful if your Terminal program on iPad is not convenient for pasting but you have, say, an editor app like PlainText that syncs with Dropbox (where you can share the URL).

## Notes

- WARNING: yt-wz will try to download the highest-quality YouTube source by default. This can easily be 100MB or more. Be aware of download speeds and data charges.