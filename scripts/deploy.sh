#!/bin/bash
set -e

IMAGE="cuidarx"
CONTAINER="cuidarx"
ENV_FILE="/opt/cuidarx/.env"

echo "🔄 Parando container antigo..."
docker stop $CONTAINER 2>/dev/null || true
docker rm $CONTAINER 2>/dev/null || true

echo "📥 Baixando imagem mais recente..."
docker pull $IMAGE:latest

echo "🚀 Iniciando novo container..."
docker run -d \
  --name $CONTAINER \
  -p 3000:3000 \
  --env-file $ENV_FILE \
  --restart unless-stopped \
  $IMAGE:latest

echo "✅ Deploy concluído! App rodando na porta 3000"
echo "📋 Logs: docker logs -f $CONTAINER"