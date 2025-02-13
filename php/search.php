<?php
include 'conexion.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$codigo = $_POST["codigo"];


$stmt = $conn->prepare("SELECT * FROM productos WHERE (codigo_barras = '$codigo' OR nombre LIKE '%$codigo%') ORDER BY nombre asc");
$stmt->execute();
//get all products
$productos = $stmt->get_result();


if ($productos->num_rows === 0) {
    echo json_encode([
        'Found' => false,
        'response' => 'No encontramos este producto, por favor registralo'
    ]);
    exit;
}
//get all products in array
$producto = $productos->fetch_all(MYSQLI_ASSOC);
echo json_encode([
    'Found' => true,
    'response' => $producto
]);
