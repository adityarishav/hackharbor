FROM debian:bullseye

# Install dependencies for Samba AD DC
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    samba \
    samba-dsdb-modules \
    samba-vfs-modules \
    winbind \
    libpam-winbind \
    libnss-winbind \
    krb5-config \
    krb5-user \
    supervisor \
    acl \
    attr \
    python3 \
    python3-pip \
    ldb-tools \
    dnsutils \
    net-tools \
    curl \
    iputils-ping \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

# Environment Variables
ENV SAMBA_DOMAIN="CERBERUS"
ENV SAMBA_REALM="CERBERUS.LOCAL"
ENV SAMBA_ADMIN_PASSWORD="Password123!"

# Setup Directories
RUN mkdir -p /var/log/supervisor
RUN mkdir -p /setup

# Copy Configuration and Scripts
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY setup/provision.sh /setup/provision.sh

RUN chmod +x /setup/provision.sh

# Expose AD Ports
EXPOSE 53 53/udp 88 88/udp 135 139 389 389/udp 445 464 464/udp 636 3268 3269

# Run Supervisor
CMD ["/usr/bin/supervisord"]
