#!/bin/bash

# Maybe it's set, else try to get from the arguments.
if [ -z "${ECHO_NEST_API_KEY}" ]
then
  ECHO_NEST_API_KEY="${1}"
fi
if [ -z "${ECHO_NEST_API_KEY}" ]
then
  echo -n "Enter your Echonest API key: "
  read ECHO_NEST_API_KEY
fi

# Try to get the music folder from the arguments.
DEFAULT_DANCE_HACKING_MUSIC_FOLDER="${HOME}/Desktop/Dance Hacking"
DANCE_HACKING_MUSIC_FOLDER="${2}"
if [ -z "${DANCE_HACKING_MUSIC_FOLDER}" ]
then
  DANCE_HACKING_MUSIC_FOLDER="${DEFAULT_DANCE_HACKING_MUSIC_FOLDER}"
fi

mkdir -p symlinks

cd symlinks

echo "Creating symlinks."

ln -s "../tools/bpm.js" "bpm" 2> /dev/null
ln -s "../tools/mp3ify" "mp3ify" 2> /dev/null
ln -s "../tools/quadify-mp3" "quadify-mp3" 2> /dev/null
ln -s "../tools/quadify-wav" "quadify-wav" 2> /dev/null
ln -s "../tools/wavify" "wavify" 2> /dev/null
ln -s "../tools/wz" "wz" 2> /dev/null
ln -s "../tools/wz-beatcaster" "wz-beatcaster" 2> /dev/null
ln -s "../tools/wz4" "wz4" 2> /dev/null
ln -s "../tools/yt" "yt" 2> /dev/null
ln -s "../tools/yt-wz" "yt-wz" 2> /dev/null

ln -s "../blender/waltz_blender.py" "waltz_blender" 2> /dev/null

ln -s "../beatcaster/beatcaster.py" "beatcaster" 2> /dev/null

ln -s "../analyze/analyze_full.sh" "analyze_full.sh" 2> /dev/null
ln -s "../analyze/analyze.py" "analyze.py" 2> /dev/null
ln -s "../analyze/analyze_full.sh" "analyze" 2> /dev/null

ln -s "../lib/youtube-dl" "youtube-dl" 2> /dev/null
ln -s "../lib/weblocify" "weblocify" 2> /dev/null
ln -s "../lib/browser-tab-osx-chrome" "browser-tab" 2> /dev/null # Assumes OS is OSX and desired browser is Chrome.

echo "Creating dance hacking folder at ${DANCE_HACKING_MUSIC_FOLDER}"

mkdir -p "${DANCE_HACKING_MUSIC_FOLDER}/Archive"
mkdir -p "${DANCE_HACKING_MUSIC_FOLDER}/Archive/temp"
mkdir -p "${DANCE_HACKING_MUSIC_FOLDER}/Archive/links"
mkdir -p "${DANCE_HACKING_MUSIC_FOLDER}/Archive/JSON"

function bash_profile_lines {
  PWD=`pwd`
  echo ""
  echo ""
  echo "## START OF DANCE HACKING"
  echo "export ECHO_NEST_API_KEY=\"${ECHO_NEST_API_KEY}\""
  echo "export DANCE_HACKING_MUSIC_FOLDER=\"${DANCE_HACKING_MUSIC_FOLDER}\""
  echo "export PATH=\"\$PATH:${PWD}\""
  echo "## END OF DANCE HACKING"
  echo ""
}

BASH_PROFILE_LOCATION=$(cd "${HOME}" && pwd)/".bash_profile"
MAGIC_STRING="DANCE HACKING"

if grep -Fq "${MAGIC_STRING}" "${BASH_PROFILE_LOCATION}"
then
  echo "It seems there that dance-hacking has been installed into .bash_profile before. You might want to check that the settings are correct."
else
  echo ""
  echo "The following lines have been added to ${BASH_PROFILE_LOCATION}"
  echo ""
  BASH_PROFILE_LINES=$(bash_profile_lines)
  echo "${BASH_PROFILE_LINES}"
  echo "${BASH_PROFILE_LINES}" >> "${BASH_PROFILE_LOCATION}"
  echo ""
fi