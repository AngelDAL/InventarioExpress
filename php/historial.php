<?php
include 'conexion.php';

header('Content-Type: application/json');

$query = "SELECT v.venta_id id, v.fecha_venta fecha, v.total, v.recibido, v.cambio, 
          GROUP_CONCAT(
              JSON_OBJECT(
                  'nombre', p.nombre,
                  'cantidad', dv.cantidad,
                  'precio', dv.precio,
                  'url_image', p.url_image
              )
          ) as productos
          FROM ventas v
          LEFT JOIN ventas_detalle dv ON v.venta_id = dv.venta_id
          LEFT JOIN productos p ON dv.producto_id = p.id
          GROUP BY v.venta_id
          ORDER BY v.fecha_venta DESC";

$result = $conn->query($query);
$ventas = [];

while ($row = $result->fetch_assoc()) {
    $row['productos'] = json_decode('[' . $row['productos'] . ']');
    $ventas[] = $row;
}

echo json_encode($ventas);
