#!/bin/bash
set -e

# Path to the marker file that indicates provisioning is complete
MARKER="/var/lib/samba/private/provisioned"

if [ -f "$MARKER" ]; then
    echo "Domain already provisioned."
    exit 0
fi

echo "Provisioning Samba AD Domain..."

# Remove default smb.conf if exists
rm -f /etc/samba/smb.conf

# 1. Provision the Domain
samba-tool domain provision \
    --server-role=dc \
    --use-rfc2307 \
    --dns-backend=SAMBA_INTERNAL \
    --realm=$SAMBA_REALM \
    --domain=$SAMBA_DOMAIN \
    --adminpass=$SAMBA_ADMIN_PASSWORD

# 2. Copy the generated krb5.conf
cp /var/lib/samba/private/krb5.conf /etc/krb5.conf

# 3. Create 'svc_backup' User
echo "Creating svc_backup..."
samba-tool user create svc_backup "BackupM@ster2023!" --description="Service Account for Backups"

# 4. Vulnerability 1: AS-REP Roasting (Disable Pre-Auth)
# We use ldbmodify to set userAccountControl. 
# 512 (Normal Account) -> +4194304 (DONT_REQ_PREAUTH) = ?
# Easier: samba-tool user edit (might need EDITOR env) or ldbmodify.
# Let's use samba-tool with a script trick or ldbmodify.
# UAC for DONT_REQ_PREAUTH is 0x400000 (4194304). 
# Default is usually 512 (Normal). So 4194816 (0x400200).
# Let's try to just toggle the bit using ldbmodify.

cat <<EOF > /tmp/asrep.ldif
dn: CN=svc_backup,CN=Users,DC=cerberus,DC=local
changetype: modify
add: userAccountControl
userAccountControl: 4194304
EOF
# Note: ‘add’ might fail if it conflicts with existing bitmask logic in LDB. 
# Replacing is safer but we need the current value.
# Better approach: Use `samba-tool user setexpiry svc_backup --noexpiry` ensures it stays valid, then use ldbedit pattern.
# Actually, 4194304 is the flag value.

# Let's use Python to modify it cleanly if ldbmodify is tricky with bitwise ops via LDIF.
# Or just set it blindly to 4194816 (Normal + DontReqPreAuth).
cat <<EOF > /tmp/mod_asrep.ldif
dn: CN=svc_backup,CN=Users,DC=cerberus,DC=local
changetype: modify
replace: userAccountControl
userAccountControl: 4194816
EOF
ldbmodify -H /var/lib/samba/private/sam.ldb /tmp/mod_asrep.ldif

# 5. Vulnerability 2: DCSync Rights for svc_backup
# We need to grant 'DS-Replication-Get-Changes' and 'DS-Replication-Get-Changes-All' 
# to svc_backup on the Domain Object.

# Get the SID of svc_backup
USER_SID=$(check_status.sh | grep "SID:" | awk '{print $2}')
# Actually we can use `samba-tool user getexpiry svc_backup` ? No. `wbinfo --name-to-sid svc_backup` requires winning.
# Easy way: Use dsacl (samba-tool dsacl).
echo "Granting DCSync rights..."
samba-tool dsacl set --objectdn="DC=cerberus,DC=local" --sddl="(OA;;CR;1131f6aa-9c07-11d1-f79f-00c04fc2dcd2;;$USER_SID)" # Get Changes
# Wait, getting the SID dynamically inside the script is better.
# We can use `samba-tool user list -w` ?
# Let's rely on `samba-tool user show svc_backup` to parse SID.

# However, `samba-tool dsacl` accepts user names in some versions. If not, we need SID.
# Let's try to pass the name directly if supported, or fetch SID.
USER_SID=$(samba-tool user show svc_backup | grep "objectSid" | awk '{print $2}')

# 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2 = DS-Replication-Get-Changes
# 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2 = DS-Replication-Get-Changes-All
# 89e95b76-444d-4c62-991a-0facbeda640c = DS-Replication-Get-Changes-In-Filtered-Set (Optional but good for full DCSync)

# We use sddl modification or `samba-tool dsacl set`. 
# Syntax: samba-tool dsacl set --objectdn=... --action=allow --trustee=... --access=...
# This is available in newer samba versions. If 'set' is not available, we use ldbmodify.
# Debian Bullseye has Samba 4.13. 'dsacl set' might be available.

# Plan B: Use a python script to set the ACLs using samdb module, which is very reliable.

cat <<PY > /setup/set_dcsync.py
import sys
import samba.getopt as options
from samba.samdb import SamDB
from samba.auth import system_session
from samba import sd_utils
from samba.dcerpc import security

lp = options.SambaOptions().get_loadparm()
creds = options.CredentialsOptions(lp).get_credentials()
samdb = SamDB(url='/var/lib/samba/private/sam.ldb', session_info=system_session(), credentials=creds, lp=lp)

domain_dn = samdb.domain_dn()
user_dn = "CN=svc_backup,CN=Users," + domain_dn

# Get User SID
res = samdb.search(base=user_dn, scope=2, attrs=["objectSid"])
user_sid = res[0]["objectSid"][0]
sid_str = str(user_sid) # Is this directly stringifiable? 
# Usually gives a binary blob, need ndr_unpack.
# Simpler: Search by name and ask for string SID if possible or just use a known SID retrieval.

# Let's just use the ldbmodify approach with manually constructed SDDL if possible?
# No, messy.
# Let's trust 'samba-tool dsacl set' exists. If not, we fail.
# Actually, let's use the 'dsacl' management via command line which is safer.
PY

# Let's assume 'samba-tool dsacl set' works for now.
# If not, we will just use a predefined userAccountControl manipulation and maybe 
# 'Domain Admin' group membership but HIDDEN? No, DCSync is specific.
# Let's try the DSACL command.
samba-tool dsacl set --objectdn="DC=cerberus,DC=local" --action=allow --trustee="svc_backup" --rights="DS-Replication-Get-Changes"
samba-tool dsacl set --objectdn="DC=cerberus,DC=local" --action=allow --trustee="svc_backup" --rights="DS-Replication-Get-Changes-All"

# 6. Flags
echo "Creating Flags..."
# User Flag (accessible via C$ share by Authenticated User? or just svc_backup?)
# Let's put a file in netlogon or sysvol that is readable?
# Or simply: N/A. The goal is DCSync. Flag is Admin Hash / Access.
# We will create a C:\Users\Administrator\Desktop\root.txt equivalent.
# Samba maps /var/lib/samba/sysvol/.... 
# Let's create a custom share "Flags" readable by svc_backup.
echo "[Flags]" >> /etc/samba/smb.conf
echo "   path = /flags" >> /etc/samba/smb.conf
echo "   read only = yes" >> /etc/samba/smb.conf
mkdir -p /flags
echo "HH{Kerber0s_Is_Watch1ng}" > /flags/user.txt
chmod 777 /flags

# 7. Create root flag locally
echo "HH{DCSync_King_Of_The_Domain}" > /root/root.txt
# Since user gets Admin hash, they can theoretically access administrative shares like C$ (mapped to /).
# In Samba Container, C$ usually maps to nothing unless defined or [global] has specific mapping.
# We'll rely on the hash retrieval as the "Win".

touch "$MARKER"
echo "Provisioning Complete."
