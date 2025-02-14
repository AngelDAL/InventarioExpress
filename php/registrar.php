<?php
include 'conexion.php';

header('Content-Type: application/json');

$nombre = $_POST['Nombre'];
$code = $_POST['Code'];
$Costo = $_POST['Costo'];
$Precio = $_POST['Precio'];

$imagenAtached = false;
$imagen = "";
if (isset($_FILES['file'])) {
    $imagen = $_FILES['file'];
    $imagenAtached = true;
} else {
    $imagen = $_POST['imagen'];
}

//if the name of imagen contains InventarioExpress, then erase it
if (strpos($imagen, 'InventarioExpress') !== false) {
    $imagen = "";
}


//save the image in the server
if ($imagenAtached) {
    $target_dir = "../Images/";
    $imageFileType = strtolower(pathinfo($imagen["name"], PATHINFO_EXTENSION));
    $target_file = $target_dir . $code . '.' . $imageFileType; // the image will be named as his code, with the respective extention
    $relativeRoute = 'Images/' . $code . '.' . $imageFileType;
    move_uploaded_file($imagen["tmp_name"], $target_file);
    $imagen = $relativeRoute;
}

// $conn->query("INSERT INTO productos (codigo_barras, nombre, descripcion, cantidad, url_image) VALUES ('$codigo', '$nombre', '$descripcion', $cantidad, '$imagen')");
//usar prepare statement
$stmt = $conn->prepare("INSERT INTO productos (codigo_barras, nombre, cantidad, url_image,costo, precio ) VALUES (?, ?, 1, ?,?,?)");
$stmt->bind_param("sssdd", $code, $nombre, $imagen, $Costo, $Precio);
$stmt->execute();
$last_id = $conn->insert_id;

echo json_encode(array(
    'status' => 'ok',
    "response" => "Registrado correctamente"
));
