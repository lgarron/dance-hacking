#!/usr/bin/env python
# encoding: utf=8

print "Doesn't work yet. Multipart uploading is difficult without a library, and for portability I don't want to depend on libraries that are not a single Python file (or maybe 2)."
exit(0)

import os, argparse, hashlib, json, urllib2_file, urllib, urllib2

# Arguments

parser = argparse.ArgumentParser(description='Use the Echonest Track API to analyze a song.')
parser.add_argument('file', action="store", metavar='out-file', type=argparse.FileType('rt'))
args = parser.parse_args()

# Get the API key from the environment
api_key = os.environ["ECHO_NEST_API_KEY"]

# Calculate the file hash.
def md5_for_file(f, block_size=2**20):
    md5 = hashlib.md5()
    while True:
        data = f.read(block_size)
        if not data:
            break
        md5.update(data)
    return md5.hexdigest()

file_md5 = md5_for_file(args.file)
file_extension = os.path.splitext(args.file.name)[1][1:]

# API 

def try_get_profile(api_key, file_md5):
    API_TRACK_PROFILE_URL = 'http://developer.echonest.com/api/v4/track/profile'
    API_TRACK_PROFILE_ARGUMENTS = {"api_key" : api_key,
      "format" : "json",
      "md5" : file_md5,
      "bucket" : "audio_summary"
      }

    data = urllib.urlencode(API_TRACK_PROFILE_ARGUMENTS)
    response_data = urllib2.urlopen(API_TRACK_PROFILE_URL + "?" + data)

    response_json = json.load(response_data)
    response_status_code = response_json["response"]["status"]["code"]
    if response_status_code != 0:
        return None

def upload_file(api_key, file_type, file_handle):
    API_TRACK_UPLOAD = 'http://developer.echonest.com/api/v4/track/upload'

    file_name = file_handle.name
    file_handle.close()

    API_TRACK_UPLOAD_ARGUMENTS = {"api_key" : api_key,
      "filetype" : "json",
      "md5" : file_type,
      "track" : open(file_name, "rb")
      }

    data = urllib.urlencode(API_TRACK_UPLOAD_ARGUMENTS)
    headers = {'content-type': 'application/multipart-file'}
    print data
    response_data = urllib2.urlopen(API_TRACK_UPLOAD, API_TRACK_UPLOAD_ARGUMENTS, headers)

    print response_data
    # response_json = json.load(response_data)
    # response_status_code = response_json["response"]["status"]["code"]
    # if response_status_code != 0:
    #     return None
    # -F "api_key=${ECHO_NEST_API_KEY}" \
    #     -F "filetype=${FILE_TYPE}" \
    #     -F "track=@${FILE_NAME}" \
    #     "http://developer.echonest.com/api/v4/track/upload"

profile = try_get_profile(api_key, file_md5)

if profile is None:
    upload_file(api_key, file_extension, args.file)

# f.seek
# args.file.close()