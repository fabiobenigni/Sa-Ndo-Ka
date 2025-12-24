# Quick Start Docker - Sa-Ndo-Ka

## Avvio Rapido

```bash
# 1. Crea il file .env (opzionale, usa i valori di default)
cp .env.example .env

# 2. Build e avvia
docker-compose up -d --build

# 3. Verifica che funzioni
curl http://localhost/api/health
```

L'applicazione sarà disponibile su `http://localhost`

## Configurazione Base

Crea un file `.env` nella root:

```env
NEXTAUTH_SECRET=genera-una-chiave-segreta-sicura-qui
# NEXTAUTH_URL può essere lasciato vuoto per rilevamento automatico
# Oppure impostalo manualmente: http://192.168.1.100, http://nas.local, etc.
NEXTAUTH_URL=
```

**Nota**: Se `NEXTAUTH_URL` è vuoto, l'applicazione tenta di rilevarlo automaticamente basandosi sull'IP della macchina host o sul dominio configurato. Vedi `DOCKER.md` per maggiori dettagli.

## Struttura

- `Dockerfile` - Immagine dell'applicazione Next.js
- `docker-compose.yml` - Configurazione completa con nginx
- `nginx/` - Configurazione nginx per reverse proxy e HTTPS
- `start.sh` - Script di avvio che inizializza il database

## Volumi

I dati persistenti sono salvati in:
- `./data/` - Database SQLite
- `./uploads/` - Immagini caricate

## HTTPS

Vedi `DOCKER.md` per istruzioni complete su configurazione HTTPS.

