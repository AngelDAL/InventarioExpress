<?php
// require_once 'conexion.php';
require_once 'database_ia.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['reset_session'])) {
    DatabaseIA::resetSession();
    echo json_encode(['response' => 'Sesión reiniciada.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['message'])) {
    $message = trim($_POST['message']);
    // $conn ya está disponible por require_once 'conexion.php'
    $dbIA = new DatabaseIA($conn);
    $respuesta = $dbIA->handleRequest($message);
    echo json_encode(['response' => $respuesta]);
    exit;
}

echo json_encode(['response' => 'No se recibió ningún mensaje.']);
exit;
