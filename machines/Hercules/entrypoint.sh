#!/bin/bash
# 1. Setup the fake AD and Samba
bash setup.sh

# 2. Start the App
echo "[+] Starting Web Server..."
exec python3 app.py