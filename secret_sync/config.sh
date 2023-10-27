
client_id=$1
echo "client_id: $client_id"

echo "create symbolic links to client templates for access & config..."

rm -f config.yml
ln -s .client/${client_id}/config.yml config.yml
echo "link .client/${client_id}/config.yml -> config.yml"

rm -f 1password-credentials.json
ln -s .client/${client_id}/1password-credentials.json 1password-credentials.json
echo "link .client/${client_id}/1password-credentials.json -> 1password-credentials.json"

rm -f .env
ln -s .client/${client_id}/.env .env
export $(grep -v '^#' .env | xargs)
echo "link .client/${client_id}/.env -> .env"

echo "restarting each container"
docker-compose down
docker-compose create
docker-compose up -d
