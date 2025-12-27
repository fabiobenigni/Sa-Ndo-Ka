#!/bin/bash

# Script per build e export Docker image per NAS

set -e

IMAGE_NAME="sa-ndo-ka"
IMAGE_TAG="latest"
DEPLOY_DIR="deploy"
TAR_FILE="${DEPLOY_DIR}/sa-ndo-ka.tar"

# Crea cartella deploy se non esiste
mkdir -p ${DEPLOY_DIR}

echo "🔨 Building Docker image for AMD64..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${IMAGE_TAG} .

echo "📦 Exporting Docker image to TAR..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${TAR_FILE}

echo "✅ Done! File ready: ${TAR_FILE}"
echo ""
echo "📋 File size:"
ls -lh ${TAR_FILE}
echo ""
echo "🚀 Upload ${TAR_FILE} to your NAS and load it with:"
echo "   docker load -i ${TAR_FILE}"
echo ""
echo "📝 Then create a container with docker-compose or manually with:"
echo "   docker run -d \\"
echo "     --name sa-ndo-ka-app \\"
echo "     -p 3000:3000 \\"
echo "     -v \$(pwd)/data:/app/data \\"
echo "     -v \$(pwd)/uploads:/app/uploads \\"
echo "     -e DATABASE_URL=file:/app/data/sa-ndo-ka.db \\"
echo "     -e NEXTAUTH_SECRET=<your-secret> \\"
echo "     -e NEXTAUTH_URL=http://<nas-ip>:3000 \\"
echo "     ${IMAGE_NAME}:${IMAGE_TAG}"

