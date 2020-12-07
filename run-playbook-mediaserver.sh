#!/usr/bin/env bash
# Dnscrypt proxy needs to come before mediaserver 
# otherwise static network configs will be set before dns resover is setup
./generate-config -s mediaserver -m os-manjaro,dnscrypt-proxy,mediaserver,docker-portainer,docker-swag,docker-nextcloud
sudo ansible-playbook playbook.yml
