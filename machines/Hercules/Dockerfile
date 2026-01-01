FROM python:3.9-slim-bullseye

# Install OpenLDAP, Samba, and Client Tools
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    slapd \
    ldap-utils \
    samba \
    smbclient \
    libsasl2-dev \
    libldap2-dev \
    libssl-dev \
    gcc \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

RUN pip install flask python-ldap flask-unsign

WORKDIR /app

# Copy all files
COPY app.py .
COPY setup.sh .
COPY entrypoint.sh .
COPY users.ldif .

# Permissions
RUN chmod +x setup.sh entrypoint.sh

# Expose Web (80), LDAP (389), SMB (445)
EXPOSE 80 389 445

ENTRYPOINT ["./entrypoint.sh"]