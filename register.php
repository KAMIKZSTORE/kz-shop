<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = trim($_POST["username"]);
    $password = $_POST["password"];
    $confirm = $_POST["confirm_password"];

    if ($password !== $confirm) {
        echo "<script>alert('Password tidak cocok!'); window.history.back();</script>";
        exit();
    }

    $usersFile = "users.txt";
    if (file_exists($usersFile)) {
        $lines = file($usersFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            list($user, $hash) = explode(':', $line);
            if ($username === $user) {
                echo "<script>alert('Username sudah digunakan!'); window.history.back();</script>";
                exit();
            }
        }
    }

    $userLine = $username . ":" . password_hash($password, PASSWORD_DEFAULT) . "\n";
    file_put_contents($usersFile, $userLine, FILE_APPEND);

    echo "<script>alert('Registrasi berhasil! Silakan login.'); window.location.href='login.html';</script>";
    exit();
}
?>
