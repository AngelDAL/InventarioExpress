<?php

require_once '../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Configuración
$clave_api = $_ENV['CLAVE_API']; // Reemplaza con tu clave de API
$id_motor = $_ENV['ID_MOTOR']; // Reemplaza con el ID de tu motor de búsqueda
$termino_busqueda = "pan blanco bimbo"; // Reemplaza con el término de búsqueda

echo($clave_api);

// // Construye la URL de la solicitud
// $url = "https://customsearch.googleapis.com/customsearch/v1?key=" . $clave_api . "&cx=" . $id_motor . "&q=" . urlencode($termino_busqueda) . "&searchType=image";

// // Realiza la solicitud
// $respuesta = file_get_contents($url);

// // Decodifica la respuesta JSON
// $datos = json_decode($respuesta, true);

// // Procesa los datos para obtener las URLs de las imágenes
// if ($datos["items"]) {
//     foreach ($datos["items"] as $item) {
//         $url_imagen = $item["link"];
//         echo $url_imagen . "<br>";
//     }
// } else {
//     echo "No se encontraron imágenes.";
// }
