#!/bin/bash

if [ ! -f /var/www/html/users.db ]; then
    echo "Initializing database..."
    php /var/www/html/db_init.php
fi

apache2-foreground