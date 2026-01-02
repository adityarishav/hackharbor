<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Pandora Helpdesk</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; }
        .container { max-width: 600px; margin-top: 50px; }
        .card { padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
<div class="container">
    <div class="card">
        <h2 class="text-center mb-4">Pandora Systems Support</h2>
        <p class="text-center text-muted">Submit a ticket and our admins will review it shortly. Admin connects from the internal secure network.</p>
        
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = $_POST['email'];
            $message = $_POST['message'];
            // Vulnerability: We store the User-Agent without sanitization
            $ua = $_SERVER['HTTP_USER_AGENT'];
            
            // Simple flat file database for the bot to read
            $ticket = json_encode(['email' => $email, 'message' => $message, 'ua' => $ua]) . "\n";
            file_put_contents('tickets/db.txt', $ticket, FILE_APPEND);
            
            echo '<div class="alert alert-success">Ticket submitted! Admin will check it soon.</div>';
        }
        ?>

        <form method="POST" action="">
            <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input type="email" class="form-control" id="email" name="email" required>
            </div>
            <div class="mb-3">
                <label for="message" class="form-label">Issue Description</label>
                <textarea class="form-control" id="message" name="message" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-100">Submit Ticket</button>
        </form>
    </div>
</div>
</body>
</html>
