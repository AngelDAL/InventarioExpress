<?php
include 'conexion.php';

header('Content-Type: application/json');


//execute SELECT * FROM productos and return the results
$sql = "SELECT * FROM productos";
$result = $conn->query($sql);

//check if there are results
if ($result->num_rows > 0) {
    //convert the results into an associative array
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    //convert the array into a JSON object
    echo json_encode($data);
} else {
    echo "0 results";
}
$conn->close();
