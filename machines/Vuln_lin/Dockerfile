FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y openssh-server sudo cron && \
    useradd -m -s /bin/bash lowpriv && \
    echo 'lowpriv:password123' | chpasswd && \
    mkdir /var/run/sshd

COPY README.txt /home/lowpriv/
RUN echo "This is the root flag: HH{Pr1vil3g3_Esc4l4ted_W1th_Wr1t4ble_Cr0n}" > /root/root_flag.txt

# 3. Create the vulnerable binary location (cleanup.sh)
RUN echo '#!/bin/bash' > /usr/local/bin/cleanup.sh
RUN echo 'echo "Running cleanup..."' >> /usr/local/bin/cleanup.sh

# VULNERABILITY: This file is world-writable and owned by lowpriv
RUN chmod 777 /usr/local/bin/cleanup.sh
RUN chown lowpriv:lowpriv /usr/local/bin/cleanup.sh

# 4. Add the Cron Job (The Exploit Trigger)
# The job runs /usr/local/bin/cleanup.sh every minute as root
RUN echo '* * * * * root /usr/local/bin/cleanup.sh' >> /etc/crontab

# 5. Add and set the entrypoint script
COPY init.sh /init.sh
RUN chmod +x /init.sh

# 6. Configure the container
EXPOSE 22
CMD ["/init.sh"]