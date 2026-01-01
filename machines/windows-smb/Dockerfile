FROM alpine:latest


RUN apk add --no-cache samba shadow

RUN mkdir -p /srv/samba/backups

ARG SMB_FLAG
RUN echo "This is a backup of the administrator's credentials." > /srv/samba/backups/readme.txt
RUN echo "HH{Smb_An0nym0us_Acc3ss_Is_B4d}" > /srv/samba/backups/flag.txt

RUN addgroup -S smbgroup && adduser -S smbuser -G smbgroup
RUN chmod -R 755 /srv/samba/backups
RUN chown -R smbuser:smbgroup /srv/samba/backups

COPY smb.conf /etc/samba/smb.conf

EXPOSE 445

CMD ["smbd", "--foreground", "--no-process-group", "--debug-stdout"]