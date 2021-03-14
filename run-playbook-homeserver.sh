#!/usr/bin/env bash
# Dnscrypt proxy needs to come before homeserver 
# otherwise static network configs will be set before dns resover is setup
./generate-config -s homeserver -m os-manjaro,dnscrypt-proxy,homeserver,docker-portainer,docker-swag,docker-nextcloud
sudo ansible-playbook playbook.yml
