var a;

var echonestAnalysis = function(file) {

  var hash;
  var audio_summary_data;
  var audio_analysis_data;
  var progressCallback = function(data) {console.log(data)};
  var doneCallback = function(){};
  var doneUploading = false;

  function done() {
    doneCallback(audio_analysis_data);
  }

  function get_audio_analysis() {
      var url = audio_summary_data.response.track.audio_summary.analysis_url;
      progressCallback("Audio analysis, unproxied URL: " + url);
      
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

  function get_audio_summary_again() {
    window.setTimeout(get_audio_summary, 5000);
  }

  var numTries = 0;
  var maxTries = 30;
  var get_audio_summary = function() {
    numTries++

    if (numTries > maxTries) {
      progressCallback("Too many tries (>" + maxTries + ") - please start over");
    }

    if (!doneUploading) {
      progressCallback("Still uploading...")
      get_audio_summary_again();
      return;
    };

    progressCallback("Polling for audio summary...")
    $.ajax({
      type: "GET",
      url: 'http://developer.echonest.com/api/v4/track/profile?api_key=EJ7ZVMPNXWVFXS1KE&format=jsonp&md5=' + hash + '&bucket=audio_summary',
      dataType: 'jsonp',
      success: function (data) {
        audio_summary_data = data; // global

        var message = audio_summary_data.response.status.message;
        var trackStatus = audio_summary_data.response.track.status;

        if (message == "Success" && trackStatus === "complete") {
            get_audio_analysis();
        } else {
            get_audio_summary_again();
        }
      }
    });
  };

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

    progressCallback("Starting analysis process...");

    var formData = new FormData();
    formData.append("api_key", "VRNSDARJUIWRYJAUX");
    formData.append("filetype", "mp3");
    formData.append("track", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://developer.echonest.com/api/v4/track/upload", true);
    xhr.onload = upload_callback;

    progressCallback("Uploading...");
    xhr.send(formData);
  }

  function analysis(theCallback) {

    if (theCallback) {
      doneCallback = theCallback;
    }

    function upload_callback(e) {
      progressCallback("Upload finished.");
      doneUploading = true;
    };
    upload(upload_callback);

    function md5sum_callback(fileHash) {
      hash = fileHash;
      get_audio_summary();
    };    
    var songMD5 = md5sum(file, md5sum_callback);

  }

  function setProgressCallback(callback) {
    progressCallback = callback;
  }

  return {
    "setProgressCallback": setProgressCallback,
    "go": analysis
  };

};