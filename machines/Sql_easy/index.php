<?php
if (!file_exists('users.db')) {
    include 'db_init.php';
}

$message = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    $db = new PDO("sqlite:users.db");
    

    $query = "SELECT is_admin FROM users WHERE username = '$username' AND password = '$password'";
    
    try {
        $result = $db->query($query);
        $user = $result->fetch(PDO::FETCH_ASSOC);

        if ($user && $user['is_admin'] == 1) {
            header("Location: flag.php");
            exit;
        } else {
            $message = "Login Failed: Invalid credentials.";
        }
    } catch (PDOException $e) {
        $message = "Login Error. Contact support.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Secure Login</title>
</head>
<body style="font-family: sans-serif; text-align: center; background-color: #f0f0f0;">
    <div style="width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; background-color: white; border-radius: 8px;">
        <h1>Secure Login Portal</h1>
        <?php if ($message): ?>
            <p style="color: red; font-weight: bold;"><?php echo htmlspecialchars($message); ?></p>
        <?php endif; ?>
        
        <form method="POST" style="margin-top: 20px;">
            <label for="username">Username:</label><br>
            <input type="text" id="username" name="username" required style="padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; width: 80%;"><br><br>
            
            <label for="password">Password:</label><br>
            <input type="password" id="password" name="password" required style="padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; width: 80%;"><br><br>
            
            <button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Sign In</button>
        </form>
        <p style="margin-top: 20px; font-size: small;">Hint: The programmer forgot to escape input strings.</p>
    </div>
</body>
</html>