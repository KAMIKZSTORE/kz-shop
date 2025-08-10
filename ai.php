<?php
header('Content-Type: application/json');

$prompt = $_POST['prompt'] ?? '';
$apiKey = 'API_KEY_GEMINI_KAMU';

// API Gemini
$ch = curl_init('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' . $apiKey);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'contents' => [['parts' => [['text' => $prompt]]]]
]));
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Maaf, tidak ada jawaban.';
echo json_encode(['reply' => $reply]);
