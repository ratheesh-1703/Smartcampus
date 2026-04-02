<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
  exit;
}

include "config.php";

$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode(["status"=>false,"message"=>"No input"]);
    exit;
}

$username = $data["username"];
$password = $data["password"];

$stmt = mysqli_prepare($conn, "SELECT * FROM users WHERE username = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if(mysqli_num_rows($result) === 1){
    $u = mysqli_fetch_assoc($result);

    if(password_verify($password, $u["password"])){
        $effectiveRole = $u["role"];

        $response = [
            "status" => true,
            "role" => $effectiveRole,
            "user_id" => $u["id"],
            "name" => $u["name"] ?? "",
            "user" => [
                "id" => $u["id"],
                "username" => $u["username"] ?? $username,
                "name" => $u["name"] ?? "",
                "role" => $effectiveRole
            ]
        ];

        if($u["role"] === "student"){
            $s = mysqli_prepare($conn, "SELECT id FROM students WHERE user_id = ? LIMIT 1");
            mysqli_stmt_bind_param($s, "i", $u["id"]);
            mysqli_stmt_execute($s);
            $sr = mysqli_stmt_get_result($s);
            if(mysqli_num_rows($sr) === 1){
                $std = mysqli_fetch_assoc($sr);
                $response["student_id"] = (int)$std["id"];
                $response["linked_id"] = (int)$std["id"];
            }
        }

        if($u["role"] === "teacher"){
            $t = mysqli_prepare($conn, "SELECT id FROM teachers WHERE user_id = ? LIMIT 1");
            mysqli_stmt_bind_param($t, "i", $u["id"]);
            mysqli_stmt_execute($t);
            $tr = mysqli_stmt_get_result($t);
            if(mysqli_num_rows($tr) === 1){
                $tc = mysqli_fetch_assoc($tr);
                $teacherId = (int)$tc["id"];
                $response["teacher_id"] = $teacherId;
                $response["linked_id"] = $teacherId;

                // Check if assigned as subject_controller (highest priority after HOD)
                $qsc = mysqli_prepare($conn, "SELECT id FROM subject_controllers WHERE teacher_id = ? AND status = 'active' LIMIT 1");
                $isSubjectController = false;
                if ($qsc) {
                    mysqli_stmt_bind_param($qsc, "i", $teacherId);
                    mysqli_stmt_execute($qsc);
                    $qscr = mysqli_stmt_get_result($qsc);
                    $isSubjectController = mysqli_num_rows($qscr) > 0;
                    mysqli_stmt_close($qsc);
                }

                if ($isSubjectController) {
                    $response["role"] = "subject_controller";
                    $response["user"]["role"] = "subject_controller";
                } else {
                    // Check HOD status if not subject controller
                    $isHod = false;

                    $qh = mysqli_prepare($conn, "SELECT id FROM hods WHERE teacher_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
                    if ($qh) {
                        mysqli_stmt_bind_param($qh, "i", $teacherId);
                        mysqli_stmt_execute($qh);
                        $qhr = mysqli_stmt_get_result($qh);
                        $isHod = mysqli_num_rows($qhr) > 0;
                        mysqli_stmt_close($qh);
                    }

                    if (!$isHod) {
                        $qd = mysqli_prepare($conn, "SELECT id FROM departments WHERE hod_id = ? LIMIT 1");
                        if ($qd) {
                            mysqli_stmt_bind_param($qd, "i", $teacherId);
                            mysqli_stmt_execute($qd);
                            $qdr = mysqli_stmt_get_result($qd);
                            $isHod = mysqli_num_rows($qdr) > 0;
                            mysqli_stmt_close($qd);
                        }
                    }

                    if ($isHod) {
                        $response["role"] = "hod";
                        $response["user"]["role"] = "hod";
                    }
                }
            }
        }

        echo json_encode($response);
        exit;
    }
}

echo json_encode([
    "status" => false,
    "message" => "Invalid username or password"
]);
?>
