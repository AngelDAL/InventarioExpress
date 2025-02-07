<?php
require_once '../vendor/autoload.php';
$curl = curl_init();
$barcode = $_POST["barcode"];
//header of json 
header('Content-Type: application/json');
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();
$ApiKeyBarcode = $_ENV['API_KEY_BARCODE'];

curl_setopt_array($curl, [
    CURLOPT_URL => "https://barcodes1.p.rapidapi.com/?query=" . $barcode,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => [
        "x-rapidapi-host: barcodes1.p.rapidapi.com",
        "x-rapidapi-key: " . $ApiKeyBarcode
    ],
    // Deshabilitar verificación SSL
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false
]);
$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    //json response
    echo $response;
}

//nombre en tittle