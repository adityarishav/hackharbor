<?php
// flag.php - Protected page containing the flag

// The flag is pulled from the Docker environment variable
$flag = getenv('SQL_FLAG');
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>ACCESS GRANTED</title>
</head>
<body style="font-family: sans-serif; text-align: center; background-color: #e6ffe6;">
    <div style="width: 600px; margin: 50px auto; padding: 30px; border: 2px solid green; background-color: #fff; border-radius: 8px;">
        <h1 style="color: green;">ADMIN ACCESS GRANTED</h1>
        <p style="font-size: 1.2em;">Congratulations, you successfully bypassed the authentication!</p>
        <p style="font-size: 1.5em; margin-top: 20px;">Your flag is:</p>
        <div style="background-color: #333; color: yellow; padding: 15px; border-radius: 4px; font-family: monospace;">
            <strong><?php echo htmlspecialchars($flag); ?></strong>
        </div>
        <p style="margin-top: 30px;"><a href="index.php" style="color: #007bff; text-decoration: none;">Go Back to Login</a></p>
    </div>
</body>
</html>