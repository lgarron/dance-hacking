#!/bin/bash

DANCE_HACKING_DIR=`dirname ${0}`

echo "Welcome to the iPad dance hacking setup script."

echo ""
echo -n "Enter your iPad's IP address: "
read IPAD_IP_ADDRESS

echo ""
echo "Transferring dance-hacking files to iPad. You will be asked for a password."
scp -r "${DANCE_HACKING_DIR}" "mobile@${IPAD_IP_ADDRESS}:/var/mobile/dance-hacking"

echo ""
echo "SSHing into the iPad. You will be asked for a password again."
echo "Once you're in, run the following command: /var/mobile/dance-hacking/iPad.install.sh"
ssh "mobile@${IPAD_IP_ADDRESS}"