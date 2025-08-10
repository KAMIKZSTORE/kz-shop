<?php
session_start();
if (!isset($_SESSION["loggedIn"]) || $_SESSION["loggedIn"] !== true) {
    header("Location: login.html");
    exit();
}
$username = $_SESSION["username"] ?? 'User';
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI Canggih — Future Chat</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <header>
    <h1>🤖 Future AI Chat</h1>
    <form action="logout.php" method="POST" style="display:inline;">
      <button type="submit" id="logoutBtn">Logout</button>
    </form>
  </header>

  <main>
    <p>Selamat datang, <b><?php echo htmlspecialchars($username); ?></b>!</p>
    <div class="chat-container">
      <div id="chatOutput"></div>
      <textarea id="userInput" placeholder="Tanya apa saja..."></textarea>
      <button id="sendBtn">Kirim</button>
    </div>
  </main>

  <script src="script.js"></script>
</body>
</html>
