#!/bin/bash
# Script per creare un archivio TAR per il deployment su NAS

set -e

DEPLOY_DIR="deploy"
TAR_NAME="sa-ndo-ka-deployment.tar"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TAR_NAME_WITH_TIMESTAMP="sa-ndo-ka-deployment-${TIMESTAMP}.tar"

echo "🚀 Creazione archivio TAR per deployment NAS..."

# Crea directory deploy se non esiste
mkdir -p "${DEPLOY_DIR}"

# Rimuovi vecchi archivi se esistono
rm -f "${DEPLOY_DIR}"/*.tar "${DEPLOY_DIR}"/*.tar.gz

# Crea un file .env.example se non esiste
if [ ! -f .env.example ]; then
  echo "📝 Creazione .env.example..."
  cat > .env.example << 'EOF'
# Database
DATABASE_URL=file:/app/data/sa-ndo-ka.db

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Porte (opzionali, per rilevamento automatico URL)
HTTP_PORT=80
HTTPS_PORT=443
DOMAIN=

# Email per Certbot (opzionale)
CERTBOT_EMAIL=admin@example.com
EOF
fi

# Crea un README per il deployment
cat > "${DEPLOY_DIR}/README-DEPLOY.md" << 'EOF'
# Guida al Deployment su NAS

## Requisiti
- Docker e Docker Compose installati sul NAS
- Accesso SSH o interfaccia web del NAS per caricare i file

## Passaggi per il Deployment

1. **Estrai l'archivio TAR**
   ```bash
   tar -xzf sa-ndo-ka-deployment-*.tar.gz
   cd sa-ndo-ka-deployment
   ```

2. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   nano .env  # o usa il tuo editor preferito
   ```
   
   Modifica almeno:
   - `NEXTAUTH_SECRET`: genera una chiave segreta sicura
   - `NEXTAUTH_URL`: imposta l'URL del tuo NAS (es. `http://192.168.1.100` o `https://nas.tuodominio.com`)

3. **Crea le directory necessarie**
   ```bash
   mkdir -p data uploads nginx/ssl
   chmod 755 data uploads nginx/ssl
   ```

4. **Costruisci e avvia i container**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

5. **Verifica lo stato**
   ```bash
   docker-compose ps
   docker-compose logs -f app
   ```

6. **Accesso all'applicazione**
   - Apri il browser e vai all'URL configurato in `NEXTAUTH_URL`
   - La prima volta, registra un nuovo utente

## Configurazione HTTPS (Opzionale)

Per abilitare HTTPS con Let's Encrypt:

1. Configura `DOMAIN` e `CERTBOT_EMAIL` nel file `.env`
2. Avvia Certbot:
   ```bash
   docker-compose --profile ssl up certbot
   ```
3. Configura Nginx per HTTPS (vedi DOCKER.md per dettagli)

## Troubleshooting

- **Errore di permessi**: Assicurati che le directory `data` e `uploads` abbiano i permessi corretti
- **Database non inizializzato**: Il database viene creato automaticamente al primo avvio
- **Porta già in uso**: Modifica `HTTP_PORT` e `HTTPS_PORT` nel file `.env`

Per maggiori dettagli, consulta DOCKER.md
EOF

echo "📦 Creazione archivio TAR..."

# Crea l'archivio TAR (senza compressione) escludendo file non necessari
tar --exclude='.git' \
    --exclude='.next' \
    --exclude='node_modules' \
    --exclude='.env*.local' \
    --exclude='*.db' \
    --exclude='*.db-journal' \
    --exclude='uploads/*' \
    --exclude='!uploads/.gitkeep' \
    --exclude='data/*' \
    --exclude='!data/.gitkeep' \
    --exclude='.DS_Store' \
    --exclude='*.log' \
    --exclude='npm-debug.log*' \
    --exclude='yarn-debug.log*' \
    --exclude='yarn-error.log*' \
    --exclude='.vscode' \
    --exclude='.idea' \
    --exclude='*.swp' \
    --exclude='*.swo' \
    --exclude='*~' \
    --exclude='coverage' \
    --exclude='.nyc_output' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='docker-test' \
    --exclude='deploy' \
    --exclude='*.tar.gz' \
    --exclude='*.tar' \
    --exclude='*.zip' \
    --exclude='.cursor' \
    -cf "${DEPLOY_DIR}/${TAR_NAME_WITH_TIMESTAMP}" \
    -C . \
    .

# Crea anche un link simbolico con nome fisso per facilità
ln -sf "${TAR_NAME_WITH_TIMESTAMP}" "${DEPLOY_DIR}/${TAR_NAME}"

# Mostra informazioni sull'archivio
ARCHIVE_SIZE=$(du -h "${DEPLOY_DIR}/${TAR_NAME_WITH_TIMESTAMP}" | cut -f1)
echo ""
echo "✅ Archivio creato con successo!"
echo "📁 File: ${DEPLOY_DIR}/${TAR_NAME_WITH_TIMESTAMP}"
echo "📊 Dimensione: ${ARCHIVE_SIZE}"
echo ""
echo "📋 Contenuto dell'archivio:"
tar -tzf "${DEPLOY_DIR}/${TAR_NAME_WITH_TIMESTAMP}" | head -20
echo "..."
echo ""
echo "🚀 Per caricare sul NAS:"
echo "   1. Trasferisci il file ${DEPLOY_DIR}/${TAR_NAME_WITH_TIMESTAMP} sul NAS"
echo "   2. Estrai l'archivio: tar -xf ${TAR_NAME_WITH_TIMESTAMP}"
echo "   3. Segui le istruzioni in README-DEPLOY.md"

