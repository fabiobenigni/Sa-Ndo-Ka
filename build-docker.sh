#!/bin/bash

# Script per build e export Docker image per NAS

set -e

IMAGE_NAME="sa-ndo-ka"
IMAGE_TAG="latest"
TAR_FILE="sa-ndo-ka.tar"

echo "Building Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

echo "Exporting Docker image to TAR..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${TAR_FILE}

echo "Compressing TAR file..."
gzip -f ${TAR_FILE}

echo "Done! File ready: ${TAR_FILE}.gz"
echo "Upload ${TAR_FILE}.gz to your NAS and load it with:"
echo "  docker load -i ${TAR_FILE}.gz"

