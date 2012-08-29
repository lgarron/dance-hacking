#!/bin/bash

. "${HOME}/.bashrc"

echo "Getting URL from ${DANCE_HACKING_PROXY_URL}"  
ACTUAL_URL=`curl --insecure "${DANCE_HACKING_PROXY_URL}"`
echo "URL is ${ACTUAL_URL}"
yt-wz "${ACTUAL_URL}"