#!/usr/bin/env bash
# Dnscrypt proxy needs to come before homeserver 
# otherwise static network configs will be set before dns resover is setup
./generate-config -s homeserver
sudo ansible-playbook playbook.yml
