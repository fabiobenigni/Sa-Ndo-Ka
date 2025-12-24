#!/bin/bash
# Script per ricostruire l'immagine Docker dopo aggiornamenti del codice

set -e

echo "🛑 Fermando i container esistenti..."
docker-compose down

echo "🔨 Ricostruendo l'immagine Docker..."
docker-compose build --no-cache

echo "🚀 Avviando i container..."
docker-compose up -d

echo "✅ Build completato! Visualizza i log con: docker-compose logs -f"
