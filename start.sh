#!/bin/sh
set -e

cd /app

# Crea directory data se non esiste
mkdir -p ./data

# Rileva automaticamente NEXTAUTH_URL se non è impostato o è localhost
if [ -z "$NEXTAUTH_URL" ] || [ "$NEXTAUTH_URL" = "http://localhost" ] || [ "$NEXTAUTH_URL" = "http://localhost:3000" ]; then
  DETECTED_URL=$(sh /app/scripts/detect-url.sh 2>/dev/null || echo "")
  if [ -n "$DETECTED_URL" ]; then
    export NEXTAUTH_URL="$DETECTED_URL"
    echo "NEXTAUTH_URL rilevato automaticamente: $NEXTAUTH_URL"
  fi
fi

# Inizializza il database se non esiste
if [ ! -f "./data/sa-ndo-ka.db" ]; then
  echo "Database non trovato, inizializzazione..."
  node scripts/init-db.js || echo "Init script completato"
fi

# Avvia l'applicazione
exec node server.js
