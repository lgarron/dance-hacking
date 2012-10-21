var a;

var echonestAnalysis = function(file) {

  var hash;
  var audio_summary_data = {};
  var audio_analysis_data = {};
  var progressCallback = function(data) {console.log(data)};
  var doneCallback = function(){};
  var doneUploading = false;
  var fractionUploaded = 0;

  function done() {
    doneCallback(audio_analysis_data);
  }

  function get_audio_analysis() {
      var url = audio_summary_data.response.track.audio_summary.analysis_url;
      progressCallback("Unproxied URL: " + url);
      progressCallback("Getting audio analysis for \"" + audio_summary_data.response.track.title + "\"");
      
      //Proxy URL to get around AWS CORS restrictions.
      var url = url.replace("https://echonest-analysis.s3.amazonaws.com", "http://www.garron.us/api/echonest/s3/proxy");

      $.ajax({
          type: "GET",
          url: url,
          success: function (data) {
              progressCallback("Retrieved data.")
              audio_analysis_data = JSON.parse(data); // global
              done();
          }
      });
  };

  var numTries = 0;
  var maxTries = 30;
  var try_get_audio_summary = function(summary_fail_callback) {
    numTries++

    if (numTries > maxTries) {
      progressCallback("Too many tries (>" + maxTries + ") - please start over");
    }


    progressCallback("Polling for audio summary (try #" + numTries + ")...")
    $.ajax({
      type: "GET",
      url: 'http://developer.echonest.com/api/v4/track/profile?api_key=EJ7ZVMPNXWVFXS1KE&format=jsonp&md5=' + hash + '&bucket=audio_summary',
      dataType: 'jsonp',
      success: function (data) {
        audio_summary_data = data; // global

        if (audio_summary_data.response.status.message === "Success" && 
            audio_summary_data.response.track.status === "complete") {
            get_audio_analysis();
        } else {
            summary_fail_callback();
        }
      }
    });
  };

  function get_audio_summary_again(delay) {
    if (!delay) {
      delay = 5000;
    }
    window.setTimeout(get_audio_summary, delay);
  }

  var get_audio_summary = function() {
    if (!doneUploading) {
      progressCallback("Still uploading (" + Math.floor(fractionUploaded*100) + "%)");
      get_audio_summary_again(1000);
      return;
    };
    try_get_audio_summary(get_audio_summary_again);
  }

  function md5sum(file, callback) {

    var fileReader = new FileReader(),
        blobSlice = File.prototype.mozSlice || File.prototype.slice,
        chunkSize = 2097152, // read in chunks of 2MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5(),
        hash = "";

    fileReader.onload = function (e) {
      spark.appendBinary(e.target.result); // append binary string
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        hash = spark.end();
        progressCallback("Hash computed: " + hash);
        callback(hash);
      }
    };

    function loadNext() {
      var start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize;

      fileReader.readAsBinaryString(blobSlice.call(file, start, end));
    };

    loadNext();
  };

  function upload(upload_callback) {
    progressCallback("Uploading...");

    var formData = new FormData();
    formData.append("api_key", "VRNSDARJUIWRYJAUX");
    formData.append("filetype", "mp3");
    formData.append("track", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://developer.echonest.com/api/v4/track/upload", true);
    xhr.upload.addEventListener("progress", function(evt){
      if (evt.lengthComputable) {
        fractionUploaded = evt.loaded / evt.total;
      }
    }, false);
    xhr.onload = upload_callback;

    xhr.send(formData);
  }

  function analysis(theCallback) {

    progressCallback("Starting analysis process...");

    if (theCallback) {
      doneCallback = theCallback;
    }

    function summary_fail_callback() {
      upload(upload_callback);
      get_audio_summary();
    }

    function upload_callback() {
      progressCallback("Upload finished.");
      doneUploading = true;
    };

    function md5sum_callback(fileHash) {
      hash = fileHash;
      try_get_audio_summary(summary_fail_callback);
    };    
    var songMD5 = md5sum(file, md5sum_callback);

  }

  function setProgressCallback(callback) {
    progressCallback = callback;
    return this; // Make it chainable.
  }

  function audio_summary() {
    return audio_summary_data;
  }

  function audio_analysis() {
    return audio_analysis_data;
  }

  return {
    "setProgressCallback": setProgressCallback,
    "go": analysis,
    "audio_summary": audio_summary,
    "audio_analysis": audio_analysis
  };

};