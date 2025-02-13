<?php
include 'conexion.php';

header('Content-Type: application/json');

$total = $_POST['total'];
$recibido = $_POST['recibido'];
$cambio = $_POST['cambio'];
$productos = json_decode($_POST['productos'], true);

$stmt = $conn->prepare("INSERT INTO ventas (fecha_venta, total, recibido, cambio, Estatus) VALUES (NOW(), ?, ?, ?, 'Pagado')");
$stmt->bind_param("ddd", $total, $recibido, $cambio);
$stmt->execute();
$last_id = $conn->insert_id;
// echo ("Venta ID : $last_id");
for ($i = 0; count($productos) > $i; $i++) {
    $productoId = $productos[$i]['id'];
    $ProductoCantidad = $productos[$i]['cantidad'];
    $productoPrecio = $productos[$i]['precio'];
    // echo ("Producto ID : $productoId");
    $stmt = $conn->prepare("INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiid", $last_id, $productoId, $ProductoCantidad, $productoPrecio);
    $stmt->execute();
}

echo json_encode(array(
    'status' => 'ok',
    "response" => "Venta registrada correctamente"
));
