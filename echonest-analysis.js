var a;

var echonestAnalysis = function(file, callback) {

  var hash;
  var audio_summary_data;
  var audio_analysis_data;

  function done() {
    callback(audio_analysis_data);
  }

  function get_audio_analysis() {
      var url = audio_summary_data.track.audio_summary.analysis_url;
      console.log("Audio analysis, unproxied URL: " + url);
      
      //Proxy URL to get around AWS CORS restrictions.
      var url = url.replace("https://echonest-analysis.s3.amazonaws.com", "http://www.garron.us/api/echonest/s3/proxy");

      $.ajax({
          type: "GET",
          url: url,
          success: function (data) {
              console.log("Retrieved data.")
              audio_analysis_data = JSON.parse(data); // global
              done();
          }
      });
  };

  var get_audio_summary = function() {
    console.log("Polling for audio summary...")
    $.ajax({
      type: "GET",
      url: 'http://developer.echonest.com/api/v4/track/profile?api_key=EJ7ZVMPNXWVFXS1KE&format=jsonp&md5=' + hash + '&bucket=audio_summary',
      dataType: 'jsonp',
      success: function (data) {
        audio_summary_data = data.response; // global

        if (audio_summary_data.track.status === "complete") {
            get_audio_analysis();
        } else {
            window.setTimeout(get_audio_summary, 2000);
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
        console.log("Hash computed: " + hash);
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

  function upload(callback) {

    console.log("Starting analysis process...");

    var formData = new FormData();
    formData.append("api_key", "VRNSDARJUIWRYJAUX");
    formData.append("filetype", "mp3");
    formData.append("track", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://developer.echonest.com/api/v4/track/upload", true);
    xhr.onload = callback;

    console.log("Uploading...");
    xhr.send(formData);
  }

  function analysis() {

    function upload_callback(e) {console.log("Upload finished.");};
    upload(file, upload_callback);

    function md5sum_callback(fileHash) {
      hash = fileHash;
      get_audio_summary();
    };    
    var songMD5 = md5sum(file, md5sum_callback);

  }

  analysis();

};