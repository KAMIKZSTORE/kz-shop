<?php
header('Content-Type: application/json');

$prompt = $_POST['prompt'] ?? '';
$apiKey = 'AIzaSyD4Wi5GShuzUWTD7l9eEf2koI9L3_mrtD4';

// Request payload sesuai contoh Google Gemini API (pastikan sesuaikan jika ada perubahan)
$data = [
    'prompt' => [
        'text' => $prompt
    ],
    'model' => 'gemini-pro',
    'temperature' => 0.7,
    'maxTokens' => 256,
];

$ch = curl_init("https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generateText?key=$apiKey");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
$response = curl_exec($ch);

if ($response === false) {
    echo json_encode(['reply' => 'Error: ' . curl_error($ch)]);
    curl_close($ch);
    exit();
}

curl_close($ch);

$resData = json_decode($response, true);

if (isset($resData['error'])) {
    echo json_encode(['reply' => 'API Error: ' . $resData['error']['message']]);
    exit();
}

// Adjust based on actual API response structure
$reply = $resData['candidates'][0]['content'] ?? 'Maaf, tidak ada jawaban.';
echo json_encode(['reply' => $reply]);
