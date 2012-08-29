#!/bin/bash

DE_FACTO_HOME_DIR="/var/mobile"

PWD=`pwd`

#STARTING_DIR="${DE_FACTO_HOME_DIR}/dance-hacking"
FULL_SCRIPT_NAME=`readlink -f $0`
DANCE_HACKING_DIR=`dirname ${FULL_SCRIPT_NAME}`

MUSIC_ROOT="${DE_FACTO_HOME_DIR}/jb/music"

cat <<HEREDOC
Assuming that the following packages are installed (will *not* check):
  - ffmpeg
  - OpenSSH (with changed passwords)
  - Python
  - cURL
HEREDOC

cd ${DE_FACTO_HOME_DIR}

mkdir -p "${MUSIC_ROOT}"
mkdir "${MUSIC_ROOT}/Music"
mkdir "${MUSIC_ROOT}/Music/temp"
mkdir "${MUSIC_ROOT}/Music/Archive"
mkdir "${MUSIC_ROOT}/Music/Archive/temp"
mkdir "${MUSIC_ROOT}/Music/Archive/links"
mkdir "${MUSIC_ROOT}/Music/Archive/JSON"

mv "${DANCE_HACKING_DIR}" "${MUSIC_ROOT}/"

cd "${MUSIC_ROOT}/dance-hacking"

# Suppressing output because the informatino about modifying .bash_profile is irrelevant.
./create_symlinks.sh > "/dev/null"

cp "${MUSIC_ROOT}/dance-hacking/iPad.bashrc" "${DE_FACTO_HOME_DIR}/.bashrc"
cp "${MUSIC_ROOT}/dance-hacking/iPad.yt-wz-auto.sh" "${DE_FACTO_HOME_DIR}/yt-wz-auto"

cd "${MUSIC_ROOT}"

cat <<HEREDOC
Done.
Try the following:

  source ~/.bashrc
  yt-wz http://www.youtube.com/watch?v=aDHxhhB8710
HEREDOC
