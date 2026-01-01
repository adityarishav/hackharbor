#!/bin/bash

echo "[+] Setting up Hercules Lab..."

# 1. Start OpenLDAP 
service slapd start
echo "Waiting for slapd to initialize..."
sleep 3

# 2. GENERATE PASSWORD HASH
PASS_HASH=$(slappasswd -s "Prettyprincess123!")

# 3. FORCE CONFIG UPDATE
# We modify the running configuration to set the Domain and Admin Password
cat <<EOF | ldapmodify -Y EXTERNAL -H ldapi:///
dn: olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcRootPW
olcRootPW: $PASS_HASH

dn: olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcSuffix
olcSuffix: dc=hercules,dc=htb

dn: olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcRootDN
olcRootDN: cn=admin,dc=hercules,dc=htb
EOF

echo "[+] Config updated. Restarting OpenLDAP to apply changes..."

# 4. RESTART SERVICE 
# The changes to RootDN/RootPW require a restart to be effective for binding
service slapd stop
sleep 2
service slapd start
sleep 3

# 5. Load Users
# Now we bind using the credentials we just enforced
echo "[+] Adding Users..."
ldapadd -x -D "cn=admin,dc=hercules,dc=htb" -w "Prettyprincess123!" -f users.ldif

if [ $? -eq 0 ]; then
    echo "[+] Users added successfully."
else
    echo "[!] ERROR: Failed to add users. Check logs above."
fi

# 6. Configure Samba (Simulation)
cat <<EOF > /etc/samba/smb.conf
[global]
   workgroup = WORKGROUP
   server string = Hercules DC
   security = user
   map to guest = Bad User
   dns proxy = no

[sysvol]
   path = /var/lib/samba/sysvol
   browsable = yes
   read only = yes
   guest ok = yes
EOF

mkdir -p /var/lib/samba/sysvol
echo "HH{f7d9c6e5b4a3_ROOT_FLAG_3d2c1b0a}" > /var/lib/samba/sysvol/root.txt
chmod 644 /var/lib/samba/sysvol/root.txt
echo "HH{you_are_web_admin_now}" > /root/flag.txt

service smbd start

echo "[+] Setup Complete."