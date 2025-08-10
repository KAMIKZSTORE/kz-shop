<?php
session_start();

$valid_username = "admin"; // Demo hardcoded user
$valid_password = "12345";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = $_POST["username"] ?? "";
    $password = $_POST["password"] ?? "";

    // Cek dari file users.txt dulu (jika ada)
    $usersFile = 'users.txt';
    $loggedIn = false;
    if (file_exists($usersFile)) {
        $lines = file($usersFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            list($user, $hash) = explode(':', $line);
            if ($username === $user && password_verify($password, $hash)) {
                $loggedIn = true;
                break;
            }
        }
    }

    // Jika gak ketemu di file, cek hardcoded
    if (!$loggedIn && $username === $valid_username && $password === $valid_password) {
        $loggedIn = true;
    }

    if ($loggedIn) {
        $_SESSION["loggedIn"] = true;
        $_SESSION["username"] = $username;
        header("Location: index.php");
        exit();
    } else {
        echo "<script>alert('Username atau password salah!'); window.history.back();</script>";
        exit();
    }
}
?>
