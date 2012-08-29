#!/bin/bash

mkdir links

cd links

ln -s "../tools/bpm.js" "bpm"
ln -s "../tools/mp3ify" "mp3ify"
ln -s "../tools/quadify-mp3" "quadify-mp3"
ln -s "../tools/quadify-wav" "quadify-wav"
ln -s "../tools/wavify" "wavify"
ln -s "../tools/wz" "wz"
ln -s "../tools/wz-beatcaster" "wz-beatcaster"
ln -s "../tools/wz4" "wz4"
ln -s "../tools/yt" "yt"
ln -s "../tools/yt-wz" "yt-wz"

ln -s "../blender/waltz_blender.py" "waltz_blender"

ln -s "../beatcaster/beatcaster.py" "beatcaster"

ln -s "../analyze/analyze_full.sh" "analyze_full.sh"
ln -s "../analyze/analyze.py" "analyze.py"
ln -s "../analyze/analyze_full.sh" "analyze"

echo ""
echo "Add the following to your ~/.bash_profile:"
echo ""
PWD=`pwd`
echo "export PATH=\"\$PATH\":${PWD}"
echo ""
