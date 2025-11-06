<?php

$db_file = '/var/www/html/users.db';
$db = new PDO("sqlite:$db_file");


$db->exec("CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER
)");

$db->exec("INSERT INTO users (username, password, is_admin) VALUES ('admin', 'd3f4ultP4$$w0rd', 1)");

$db->exec("INSERT INTO users (username, password, is_admin) VALUES ('guest', 'guestpass', 0)");

echo "Database initialized successfully.\n";
?>