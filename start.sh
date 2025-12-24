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

# Inizializza il database se non esiste o è vuoto
if [ ! -f "./data/sa-ndo-ka.db" ] || [ ! -s "./data/sa-ndo-ka.db" ]; then
  echo "Database non trovato o vuoto, inizializzazione..."
  # Usa Prisma CLI per inizializzare il database
  if [ -f "./node_modules/prisma/package.json" ]; then
    echo "Eseguo Prisma db push..."
    DATABASE_URL="file:/app/data/sa-ndo-ka.db" node ./node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate 2>&1 || \
    DATABASE_URL="file:/app/data/sa-ndo-ka.db" node ./node_modules/.bin/prisma db push --accept-data-loss --skip-generate 2>&1 || \
    echo "Prisma CLI non disponibile, uso script alternativo"
  fi
  # Fallback: usa lo script Node.js SQL
  node scripts/init-db-sql.js || echo "Init script completato"
fi

# Avvia l'applicazione
exec node server.js
