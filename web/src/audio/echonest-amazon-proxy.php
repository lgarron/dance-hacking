<?php

$call = filter_var($_GET["call"], FILTER_SANITIZE_URL);

echo file_get_contents("https://echonest-analysis.s3.amazonaws.com/".$call);
echo file_get_contents("https://echonest-analysis.s3.amazonaws.com/TR/TRGOVKX128F7FA5920/3/full.json?Signature=FCyMZ%2B8i26AmoCeSZKCyAkkcBz0%3D&Expires=1335764965&AWSAccessKeyId=AKIAJRDFEY23UEVW42BQ")

?>