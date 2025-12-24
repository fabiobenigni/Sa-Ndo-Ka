#!/bin/sh
set -e

cd /app

# Crea directory data se non esiste
mkdir -p ./data

# Inizializza il database se non esiste
if [ ! -f "./data/sa-ndo-ka.db" ]; then
  echo "Database non trovato, inizializzazione..."
  node scripts/init-db.js || echo "Init script completato"
fi

# Avvia l'applicazione
exec node server.js
