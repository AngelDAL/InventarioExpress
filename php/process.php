<?php
include 'conexion.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$codigo = $_POST["codigo"];

// Verificar si el producto existe
// $producto = $conn->query("SELECT * FROM productos WHERE codigo_barras = '$codigo'");
//usar prepare statement
$stmt = $conn->prepare("SELECT * FROM productos WHERE codigo_barras = ?");
$stmt->bind_param("s", $codigo);
$stmt->execute();
$producto = $stmt->get_result();

if ($producto->num_rows === 0) {
    echo json_encode([
        'NotFound' => true,
        'response' => 'No encontramos este producto, por favor registralo'
    ]);
    exit;
}

$producto = $producto->fetch_assoc();

echo json_encode([
    'NotFound' => false,
    'response' => $producto
]);
