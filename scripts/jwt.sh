#!/usr/bin/env zsh

SERVICE_ACCOUNT_KEY_PATH='./serviceAccount.json'
JWT_HEADER='{"alg":"RS256","typ":"JWT"}'
JWT_CLAIM_TEMPLATE='
{
  "iss":"{{client_email}}",
  "scope":"https://www.googleapis.com/auth/cloud-platform",
  "aud":"https://oauth2.googleapis.com/token",
  "exp":"{{expiration}}",
  "iat":"{{issued_at}}"
}'

# Create the JWT
PRIVATE_KEY=$(jq -r '.private_key' $SERVICE_ACCOUNT_KEY_PATH)
CLIENT_EMAIL=$(jq -r '.client_email' $SERVICE_ACCOUNT_KEY_PATH)
CURRENT_TIME=$(date +%s)
EXPIRATION=$(($CURRENT_TIME + 3600 ))
JWT_CLAIM=$(echo $JWT_CLAIM_TEMPLATE \
  | jq --arg client_email $CLIENT_EMAIL --argjson expiration $EXPIRATION --argjson issued_at $CURRENT_TIME '.iss = $client_email | .exp = $expiration | .iat = $issued_at')
JWT_DATA=$(echo -n $JWT_HEADER | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"."$(echo -n $JWT_CLAIM | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
JWT_SIGNATURE=$(echo -n $JWT_DATA | openssl dgst -sha256 -binary -sign <(echo -n $PRIVATE_KEY) | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
JWT=$JWT_DATA"."$JWT_SIGNATURE

# Request the token and print to console
ACCESS_TOKEN=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  --data-urlencode "assertion=$JWT" \
  | jq -r '.access_token')
echo "::ACCESS_TOKEN::"
echo $ACCESS_TOKEN
