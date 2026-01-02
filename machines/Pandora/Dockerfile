FROM php:7.4-apache

# Install dependencies for Samba, Python (Bot), and System Utilities
RUN apt-get update && apt-get install -y \
    samba \
    samba-common-bin \
    python3 \
    python3-pip \
    supervisor \
    net-tools \
    curl \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies for the Bot
RUN pip3 install requests requests_ntlm

# Setup Users
# 1. 'admin' for Web/SMB (Simulated Victim)
RUN useradd -m -s /bin/bash admin && echo "admin:SuperSecretP@ssw0rd" | chpasswd

# 2. 'pandora' (User Flag Target) - Low priv but access to specific binaries? 
# Actually, for this path, we might just use www-data as the entry and then root.
# Let's clean this up:
# - www-data is the web user.
# - We need a user for the NTLM auth: 'admin' (This is the one we steal session for).
# - We need a target for RCE: www-data (running Apache).

# Samba Configuration
RUN mkdir -p /var/www/html/tickets && \
    chmod 777 /var/www/html/tickets && \
    chown -R www-data:www-data /var/www/html

# Add admin to samba
RUN (echo "SuperSecretP@ssw0rd"; echo "SuperSecretP@ssw0rd") | smbpasswd -a admin -s

# Copy Configuration
COPY config/smb.conf /etc/samba/smb.conf
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy Web App
COPY src/ /var/www/html/

# Copy Bot
COPY bot/ /opt/bot/

# Copy PrivEsc Binary
COPY bin/check_status.sh /usr/local/bin/check_status
RUN chmod +x /usr/local/bin/check_status && \
    chmod u+s /usr/local/bin/check_status

# Flag Setup
RUN echo "HH{NTLM_R3l4y_M4st3r}" > /root/root.txt
RUN echo "HH{XSS_T0_RCE_P1p3l1n3}" > /var/www/html/user.txt

# Permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80 445

CMD ["/usr/bin/supervisord"]
