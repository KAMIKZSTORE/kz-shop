<?php
header('Content-Type: application/json');
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// Demo login
if ($username === 'admin' && $password === '1234') {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Username atau password salah']);
}
