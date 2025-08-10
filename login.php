<?php
$valid_username = "admin";
$valid_password = "12345";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = $_POST["username"] ?? "";
    $password = $_POST["password"] ?? "";

    if ($username === $valid_username && $password === $valid_password) {
        session_start();
        $_SESSION["loggedIn"] = true;
        header("Location: index.html");
        exit();
    } else {
        echo "<script>alert('Username atau password salah!'); window.history.back();</script>";
        exit();
    }
}
?>
