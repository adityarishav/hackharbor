<?php
// Only accessible by localhost (The Bot)
if ($_SERVER['REMOTE_ADDR'] !== '127.0.0.1' && $_SERVER['REMOTE_ADDR'] !== '::1') {
    die("Access Denied: Internal Admin Only.");
}
?>
<!DOCTYPE html>
<html>
<head><title>Admin Dashboard</title></head>
<body>
<h1>Ticket Review</h1>
<?php
// Vulnerability: Displaying the stored User-Agent WITHOUT sanitization.
// This triggers the Blind XSS when the Bot (which behaves like a browser) reads this page.

$file = 'tickets/db.txt';
if (file_exists($file)) {
    $lines = file($file);
    foreach ($lines as $line) {
        $data = json_decode($line, true);
        echo "<div class='ticket'>";
        echo "<p><strong>Email:</strong> " . htmlspecialchars($data['email']) . "</p>";
        echo "<p><strong>Message:</strong> " . htmlspecialchars($data['message']) . "</p>";
        // XSS HERE:
        echo "<p><strong>User-Agent:</strong> " . $data['ua'] . "</p>"; 
        echo "</div><hr>";
    }
} else {
    echo "No tickets.";
}
?>
</body>
</html>
