<?php
require_once 'conexion.php';
session_start();

// Ejemplo de uso:
// $dbIA = new DatabaseIA($conn);
// $respuesta = $dbIA->handleRequest("¿Cuántos productos diferentes tengo en inventario?");
// print_r($respuesta);

class DatabaseIA
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // Maneja el historial de mensajes en la sesión
    private function addToHistory($role, $message)
    {
        if (!isset($_SESSION['ia_history'])) {
            $_SESSION['ia_history'] = [];
        }
        $_SESSION['ia_history'][] = ['role' => $role, 'message' => $message];
        // Mantener solo los últimos 5 mensajes de cada rol
        $user = array_filter($_SESSION['ia_history'], fn($m) => $m['role'] === 'user');
        $ai = array_filter($_SESSION['ia_history'], fn($m) => $m['role'] === 'ai');
        $_SESSION['ia_history'] = array_slice($user, -15) + array_slice($ai, -15);
        // Reindexar
        $_SESSION['ia_history'] = array_values($_SESSION['ia_history']);
    }

    private function getHistoryPrompt()
    {
        if (!isset($_SESSION['ia_history'])) return '';
        $prompt = "";
        // Recorrer el historial en orden y agregar cada mensaje al prompt
        foreach ($_SESSION['ia_history'] as $msg) {
            if ($msg['role'] === 'user') {
                $prompt .= "Usuario: " . $msg['message'] . "\n";
            } else {
                $prompt .= "IA: " . $msg['message'] . "\n";
            }
        }
        return $prompt;
    }

    // Obtiene la estructura de todas las tablas y sus columnas
    public function getDatabaseStructure()
    {
        $structure = [];
        $tablesResult = $this->conn->query("SHOW TABLES");
        while ($row = $tablesResult->fetch_array()) {
            $table = $row[0];
            $columnsResult = $this->conn->query("SHOW COLUMNS FROM `$table`");
            $columns = [];
            while ($col = $columnsResult->fetch_assoc()) {
                $columns[$col['Field']] = $col['Type'];
            }
            $structure[$table] = $columns;
        }
        return $structure;
    }

    // Realiza una llamada CURL a la API de Google para interpretar la solicitud
    private function callGoogleAPI($request, $structure)
    {
        $apiKey = $_ENV["API_GOOGLE_IA"];
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;

        $history = $this->getHistoryPrompt();
        $prompt = $history .
            "Estructura de la base de datos:\n" . json_encode($structure, JSON_PRETTY_PRINT) .
            "\n\nSolicitud del usuario: \"$request\"\n\nDevuelve únicamente la consulta SQL lista para ser ejecutada. No incluyas ningún texto adicional, solo la consulta SQL.";

        $data = [
            "contents" => [
                "parts" => [
                    [
                        "text" => $prompt
                    ]
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['candidates'][0]['content']["parts"][0]['text'])) {
            $sql = trim($result['candidates'][0]['content']["parts"][0]['text']);
            // Elimina posibles etiquetas de código o comentarios
            $sql = preg_replace('/^```sql|^```|\s*--.*$/m', '', $sql);
            $sql = trim($sql);
            $this->addToHistory('ai', $sql);
            return $sql;
        }
        return null;
    }

    // Interpreta la solicitud en lenguaje natural usando la API de Google
    public function interpretRequest($request, $structure)
    {
        $sql = $this->callGoogleAPI($request, $structure);
        if (!$sql) {
            return [
                'sql' => null,
                'respuesta' => 'No se pudo interpretar la solicitud.'
            ];
        }
        return [
            'sql' => $sql,
            'respuesta' => 'Consulta generada automáticamente.'
        ];
    }

    // Ejecuta la consulta SQL y devuelve el resultado
    public function executeQuery($sql)
    {
        $result = $this->conn->query($sql);
        if ($result && $row = $result->fetch_assoc()) {
            return $row;
        }
        return null;
    }

    // Envía el resultado de la consulta a la IA para interpretación en lenguaje natural
    private function interpretResultWithAI($request, $result)
    {
        $apiKey = $_ENV["API_GOOGLE_IA"];
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;

        $history = $this->getHistoryPrompt();
        $prompt = $history .
            "Solicitud original del usuario: \"$request\"\n\nResultado SQL: " . json_encode($result, JSON_PRETTY_PRINT) .
            "\n\nRedacta una respuesta clara y concisa para el usuario basada en el resultado proporcionado. Responde solo con la interpretación en español, sin incluir ningún texto técnico ni SQL.";

        $data = [
            "contents" => [
                "parts" => [
                    [
                        "text" => $prompt
                    ]
                ]
            ]

        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['candidates'][0]['content']["parts"][0]['text'])) {
            $respuesta = trim($result['candidates'][0]['content']["parts"][0]['text']);
            $this->addToHistory('ai', $respuesta);
            return $respuesta;
        }
        return null;
    }

    // Limpia el historial de la sesión de la IA
    public static function resetSession()
    {
        if (isset($_SESSION['ia_history'])) {
            unset($_SESSION['ia_history']);
        }
    }

    // Flujo principal: recibe la solicitud y devuelve la respuesta
    public function handleRequest($request)
    {
        $this->addToHistory('user', $request);

        // Palabras clave para detectar si es una consulta a la base de datos
        $keywords = [
            'cuántos',
            'cuanto',
            'listar',
            'muestra',
            'mostrar',
            'consulta',
            'dame',
            'cuál es',
            'cuáles son',
            'hay',
            'inventario',
            'productos',
            'existencias',
            'cantidad',
            'total',
            'registros'
        ];
        $isDBQuery = true;
        // $lowerRequest = mb_strtolower($request, 'UTF-8');
        // foreach ($keywords as $kw) {
        //     if (strpos($lowerRequest, $kw) !== false) {
        //         $isDBQuery = true;
        //         break;
        //     }
        // }

        if ($isDBQuery) {
            $structure = $this->getDatabaseStructure();
            $interpretation = $this->interpretRequest($request, $structure);
            $data = $this->executeQuery($interpretation['sql']);
            if ($data) {
                $respuestaFinal = $this->interpretResultWithAI($request, $data);
                return $respuestaFinal;
            }
            return "No se pudo obtener un resultado para la solicitud.";
        } else {
            // Solo conversación, sin consultar la base de datos
            $apiKey = $_ENV["API_GOOGLE_IA"];
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;
            $history = $this->getHistoryPrompt();
            $prompt = $history .
                "Usuario: \"$request\"\n\nResponde de forma clara y útil en español, considerando el historial de la conversación. No incluyas texto técnico ni SQL. Pero si puedes mostrar listas de datos, hazlo de forma clara y concisa.";
            $data = [
                "contents" => [
                    "parts" => [
                        [
                            "text" => $prompt
                        ]
                    ]
                ]
            ];
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json'
            ]);
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);
            if (isset($result['candidates'][0]['content']["parts"][0]['text'])) {
                $respuesta = trim($result['candidates'][0]['content']["parts"][0]['text']);
                $this->addToHistory('ai', $respuesta);
                return $respuesta;
            }
            return "No se pudo obtener una respuesta de la IA.";
        }
    }
}
