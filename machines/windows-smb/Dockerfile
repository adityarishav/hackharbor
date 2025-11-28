FROM alpine:latest

# Install Samba
RUN apk add --no-cache samba shadow

# 1. Create the shared directory
RUN mkdir -p /srv/samba/backups

# 2. Create the Flag File inside the share
ARG SMB_FLAG
RUN echo "This is a backup of the administrator's credentials." > /srv/samba/backups/readme.txt
# We hide the flag in a "hidden" file (starting with dot) or just a regular file
RUN echo "HH{Smb_An0nym0us_Acc3ss_Is_B4d}" > /srv/samba/backups/flag.txt

# 3. Create a specialized user (optional, but good for realism)
RUN addgroup -S smbgroup && adduser -S smbuser -G smbgroup
# Set ownership so the guest user can read it
RUN chmod -R 755 /srv/samba/backups
RUN chown -R smbuser:smbgroup /srv/samba/backups

# 4. Copy the configuration file
COPY smb.conf /etc/samba/smb.conf

# 5. Expose the SMB port
EXPOSE 445

# Start the Samba daemon in foreground
# FIX: Changed --log-stdout to --debug-stdout based on the error message
CMD ["smbd", "--foreground", "--no-process-group", "--debug-stdout"]