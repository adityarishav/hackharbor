#!/bin/bash

/usr/sbin/sshd -D &

service cron start

tail -f /dev/null