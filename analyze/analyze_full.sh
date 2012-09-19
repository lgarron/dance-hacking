#!/bin/bash

# Needs an externally defined variable $ECHO_NEST_API_KEY in order to work.

if [ -z "$ECHO_NEST_API_KEY" ]
then
	echo "No \$ECHO_NEST_API_KEY environment variable has been set. Cannot analyze using Echonest."
	exit 0
fi

FILE_NAME="${1}"
FILE_TYPE="${FILE_NAME##*.}"
JSON_CACHE_FOLDER="${HOME}/Documents/Throw/Music/Archive/JSON/"
CHECKING_SLEEP="2"

echo "Computing hash..."

FILE_MD5=`openssl md5 "${FILE_NAME}" | sed "s/^.*= //"`

function get_profile {
	curl "http://developer.echonest.com/api/v4/track/profile?api_key=${ECHO_NEST_API_KEY}&format=json&md5=${FILE_MD5}&bucket=audio_summary" 2> /dev/null
}

function post_upload {
	curl \
		--progress-bar \
		-F "api_key=${ECHO_NEST_API_KEY}" \
		-F "filetype=${FILE_TYPE}" \
		-F "track=@${FILE_NAME}" \
		"http://developer.echonest.com/api/v4/track/upload"
}

PROFILE=`get_profile`

ALREADY_EXISTED_SUCCESS=`echo "${PROFILE}" | grep "Success"`
if [ "${ALREADY_EXISTED_SUCCESS}" = "" ]
then
	echo "Uploading..."
	UPLOAD=`post_upload`

	echo "Upload response: ${UPLOAD}"
	PROFILE=`get_profile`
else
	echo "Already existed. No need to upload."
fi

while [[ "${PROFILE}" =~ .*"\"status\":".?"\"pending\"".* ]] # Totally fragile hack, but it was better than spending more hours figuring out how to do multipart uploads in Python without an external library.
do
	echo "Analysis pending. Checking for it every ${CHECKING_SLEEP} seconds..."
	sleep "${CHECKING_SLEEP}"
	PROFILE=`get_profile`
done

URL=`echo $PROFILE | sed "s/^.*analysis_url.: \"\([^\"]*\)\".*\$/\1/"`

# Sanity check: We have the file now?
if [[ "${PROFILE}" =~ .*"\"status\":".?"\"complete\"".* ]]
then
	echo "Downloading the analysis..."
	echo "URL: ${URL}"

	curl "${URL}" > "${FILE_NAME}.json" 2> /dev/null
	cp "${FILE_NAME}.json" "${JSON_CACHE_FOLDER}/${FILE_NAME}.json"

	echo "Written to: ${JSON_CACHE_FOLDER}/${FILE_NAME}.json"
	exit 0
else
	echo "Could not get analysis. Sorry. Here's the last response from Echonest:"
	echo "${PROFILE}"
	exit 1
fi
