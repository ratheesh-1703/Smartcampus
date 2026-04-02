<?php
/**
 * DATABASE HELPER - Prepared Statements for Security
 * Prevents SQL Injection, enforces type binding
 */

class DBHelper {
    private $conn;
    
    public function __construct($mysqli_connection) {
        $this->conn = $mysqli_connection;
    }
    
    /**
     * SELECT query with prepared statement
     * @param string $query SQL query with ?
     * @param array $params Parameters to bind
     * @param string $types Type string (i=int, s=string, d=double, b=blob)
     */
    public function select($query, $params = [], $types = "") {
        $stmt = $this->conn->prepare($query);
        if(!$stmt) {
            return ["error" => "Prepare failed: " . $this->conn->error];
        }
        
        if(!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        if(!$stmt->execute()) {
            return ["error" => "Execute failed: " . $stmt->error];
        }
        
        $result = $stmt->get_result();
        $data = [];
        while($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        $stmt->close();
        
        return $data;
    }
    
    /**
     * SELECT single row
     */
    public function selectOne($query, $params = [], $types = "") {
        $data = $this->select($query, $params, $types);
        if(isset($data["error"])) return $data;
        return $data[0] ?? null;
    }
    
    /**
     * SELECT COUNT
     */
    public function count($query, $params = [], $types = "") {
        $data = $this->selectOne($query, $params, $types);
        if($data === null) return 0;
        $key = array_key_first($data);
        return intval($data[$key] ?? 0);
    }
    
    /**
     * INSERT/UPDATE/DELETE
     */
    public function execute($query, $params = [], $types = "") {
        $stmt = $this->conn->prepare($query);
        if(!$stmt) {
            return ["success" => false, "error" => "Prepare failed: " . $this->conn->error];
        }
        
        if(!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        if(!$stmt->execute()) {
            return ["success" => false, "error" => "Execute failed: " . $stmt->error];
        }
        
        $affected = $stmt->affected_rows;
        $stmt->close();
        
        return ["success" => true, "affected" => $affected];
    }
    
    /**
     * INSERT and get last ID
     */
    public function insertId($query, $params = [], $types = "") {
        $result = $this->execute($query, $params, $types);
        if(!$result["success"]) return $result;
        
        return ["success" => true, "id" => $this->conn->insert_id];
    }
    
    /**
     * Run transaction
     */
    public function transaction($callback) {
        $this->conn->begin_transaction();
        try {
            $result = $callback($this);
            $this->conn->commit();
            return $result;
        } catch (Exception $e) {
            $this->conn->rollback();
            return ["success" => false, "error" => $e->getMessage()];
        }
    }
}

?>
