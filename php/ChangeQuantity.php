<?php
include 'conexion.php';

$code = $_POST['code'];
$AddOrRest = $_POST['AddOrRest'];

if ($AddOrRest == "ADD") {
    $stmt = $conn->prepare("UPDATE productos SET cantidad = cantidad + 1 WHERE codigo_barras = ?");
    $stmt->bind_param("s", $code);
    $stmt->execute();
}
if ($AddOrRest == "REST") {
    $stmt = $conn->prepare("UPDATE productos SET cantidad = cantidad - 1 WHERE codigo_barras = ? and cantidad > 0");
    $stmt->bind_param("s", $code);
    $stmt->execute();
}

echo json_encode(array(
    'status' => 'ok',
    "response" => "Cantidad actualizada correctamente"
));
