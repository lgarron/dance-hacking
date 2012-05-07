#!/bin/bash

# Needs an externally defined variable $ECHO_NEST_API_KEY in order to work.

FILE_NAME="${1}"
FILE_TYPE="${FILE_NAME##*.}"

echo "Uploading..."

UPLOAD=`curl \
	--progress-bar \
	-F "api_key=${ECHO_NEST_API_KEY}" \
	-F "filetype=${FILE_TYPE}" \
	-F "track=@${FILE_NAME}" \
	"http://developer.echonest.com/api/v4/track/upload"`

echo "Upload response: ${UPLOAD}"

FILE_MD5=`openssl md5 "${FILE_NAME}" | sed "s/^.*= //"`

echo "Checking for the analysis..."

ANALYZE=`curl \
	-F "api_key=${ECHO_NEST_API_KEY}" \
	-F "format=json" \
	-F "md5=${FILE_MD5}" \
	-F "bucket=audio_summary" \
	"http://developer.echonest.com/api/v4/track/analyze"`

echo
echo
echo "${ANALYZE}"
echo
echo


URL=`echo $ANALYZE | sed "s/^.*analysis_url.: \"\([^\"]*\)\".*\$/\1/"`

echo "Getting the analysis..."
echo "URL: ${URL}"

curl "${URL}" > "${FILE_NAME}.json"