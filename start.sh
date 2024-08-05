#!/bin/bash

bun server &

sleep 5

HOST_IP=$(hostname -i)

RESPONSE=$(curl -s -X POST http://$HOST_IP:3000/register -H "Content-Type: application/json" -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

echo "Registration response: $RESPONSE"

echo "Username: $USERNAME"
echo "Password: $PASSWORD"

JWT=$(curl -s -X POST http://$HOST_IP:3000/login -H "Content-Type: application/json" -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}" | jq -r '.token')

# Log the JWT
echo "JWT: $JWT"

export JWT_TOKEN=$JWT

tail -f /dev/null