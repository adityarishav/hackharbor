#!/bin/bash

# PrivEsc Script: check_status
# This script is SUID root.
# Vulnerability: It uses a wildcard with tar or execute arbitrary command via input.

echo "Pandora Service Status Checker"
echo "Select service to check:"
echo "1. Web Server"
echo "2. Samba Server"
echo "3. Custom Log Backup"

read -p "> " choice

if [ "$choice" == "1" ]; then
    systemctl status apache2
elif [ "$choice" == "2" ]; then
    systemctl status smbd
elif [ "$choice" == "3" ]; then
    # Vulnerability: Wildcard injection in tar
    # Navigate to a user-writable directory (e.g. /tmp or provided path)
    
    echo "Backing up logs from /var/www/html/tickets/..."
    cd /var/www/html/tickets
    
    # The vulnerability: 'tar *' allows exploitation if files like '--checkpoint=1' exist.
    tar -cf /tmp/backup.tar *
    
    echo "Backup created at /tmp/backup.tar"
else
    echo "Invalid option."
fi
