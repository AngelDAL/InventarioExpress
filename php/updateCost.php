<?php
include 'conexion.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$Code = $_POST["code"];
$newCost = $_POST["newCost"];

$stmt = $conn->prepare("UPDATE productos SET costo = ? WHERE codigo_barras = ? ");
$stmt->bind_param("ds", $newCost, $Code);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode([
        'status' => 'ok',
        'response' => 'Precio actualizado correctamente'

    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'response' => 'No se pudo actualizar el precio',
        "code" => $Code,
    ]);
}
