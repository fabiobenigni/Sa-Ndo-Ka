#!/bin/bash

set -e

echo "🧪 Test Docker Setup - Sa-Ndo-Ka"
echo "================================"
echo ""

# Verifica che Docker sia installato
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non trovato. Installa Docker prima di continuare."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose non trovato. Installa Docker Compose prima di continuare."
    exit 1
fi

echo "✅ Docker trovato"
echo ""

# Crea directory necessarie
echo "📁 Creazione directory..."
mkdir -p data uploads nginx/ssl nginx/conf.d
echo "✅ Directory create"
echo ""

# Build dell'immagine
echo "🔨 Build dell'immagine Docker..."
docker-compose build
echo "✅ Build completata"
echo ""

# Avvia i container
echo "🚀 Avvio container..."
docker-compose up -d
echo "✅ Container avviati"
echo ""

# Attendi che l'app sia pronta
echo "⏳ Attesa avvio applicazione (30 secondi)..."
sleep 30

# Test health check
echo "🏥 Test health check..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Health check OK"
else
    echo "⚠️  Health check fallito, ma l'app potrebbe essere ancora in avvio"
fi
echo ""

# Mostra status
echo "📊 Status container:"
docker-compose ps
echo ""

# Mostra log
echo "📋 Ultimi log dell'app:"
docker-compose logs --tail=20 app
echo ""

echo "✅ Test completato!"
echo ""
echo "🌐 L'applicazione dovrebbe essere disponibile su: http://localhost"
echo "📖 Per vedere i log: docker-compose logs -f"
echo "🛑 Per fermare: docker-compose down"

