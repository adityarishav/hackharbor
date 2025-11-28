<?php

$file = $_GET['page'] ?? 'contact.html';

$file = str_replace(array('../', '..\\'), '', $file);


$file = urldecode($file);

$base_dir = __DIR__ . "/pages/";
$target_file = $base_dir . $file; 

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>File Viewer Service</title>
    <style>
        body { font-family: sans-serif; background-color: #0b132b; color: white; padding: 20px; }
        h1 { color: #ff5757; }
        .content-box { background-color: #1c2541; padding: 15px; border-radius: 6px; white-space: pre-wrap; border-left: 3px solid #ff5757; }
        a { color: #6fffe9; margin-right: 15px; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Secure Document Viewer</h1>
    <p>Viewing document: <strong><?php echo htmlspecialchars($file); ?></strong></p>
    
    <div style="margin-bottom: 20px;">
        <a href="?page=contact.html">Contact</a>
        <a href="?page=about.html">About</a>
    </div>

    <div class="content-box">
        <?php

        if (file_exists($target_file)) {
            echo htmlspecialchars(file_get_contents($target_file));
        } else {
            echo "Error: File not found.";
            echo "\n[DEBUG: Tried to access: " . htmlspecialchars($target_file) . "]";
        }
        ?>
    </div>
</body>
</html>