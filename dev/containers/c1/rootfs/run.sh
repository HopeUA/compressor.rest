#!/bin/bash

set -e
set -u

# User-provided env variables
SSH_USER=${SSH_USER:="root"}
SSH_PASS=${SSH_PASS:-$(pwgen -s 12 1)}
LOCK="/run.lock"

if [ ! -f "${LOCK}" ]; then
    echo "${SSH_USER}:${SSH_PASS}" | chpasswd

    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key < /dev/null
    ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key < /dev/null

    touch ${LOCK}
fi

exec /usr/sbin/sshd -D -e
