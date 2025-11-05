#!/bin/bash
# init.sh

# Start the SSH daemon
/usr/sbin/sshd -D &

# Start the Cron service in the background
service cron start

# Keep the container running
tail -f /dev/null