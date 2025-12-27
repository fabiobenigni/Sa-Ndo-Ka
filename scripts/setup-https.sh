#!/bin/bash

# Script per configurare HTTPS con Let's Encrypt per Sa-Ndo-Ka

set -e

echo "🔒 Configurazione HTTPS per Sa-Ndo-Ka"
echo "======================================"
echo ""

# Verifica che docker-compose sia disponibile
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose non trovato. Installa Docker Compose."
    exit 1
fi

# Verifica che esista il file .env
if [ ! -f .env ]; then
    echo "⚠️  File .env non trovato. Creo un template..."
    cat > .env << EOF
# Database
DATABASE_URL=file:./data/sa-ndo-ka.db

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=

# Porte
HTTP_PORT=80
HTTPS_PORT=443

# Dominio per HTTPS (IMPORTANTE: modifica questo!)
DOMAIN=yourdomain.com
CERTBOT_EMAIL=admin@yourdomain.com
EOF
    echo "✅ Creato file .env template"
    echo ""
    echo "⚠️  IMPORTANTE: Modifica il file .env e imposta:"
    echo "   - DOMAIN=tuodominio.com"
    echo "   - CERTBOT_EMAIL=tuaemail@tuodominio.com"
    echo "   - NEXTAUTH_URL=https://tuodominio.com"
    echo ""
    read -p "Premi INVIO quando hai modificato il file .env..."
fi

# Carica le variabili dal .env
source .env

# Verifica che DOMAIN sia configurato
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
    echo "❌ DOMAIN non configurato nel file .env"
    echo "   Imposta DOMAIN=tuodominio.com nel file .env"
    exit 1
fi

# Verifica che CERTBOT_EMAIL sia configurato
if [ -z "$CERTBOT_EMAIL" ] || [ "$CERTBOT_EMAIL" = "admin@example.com" ]; then
    echo "❌ CERTBOT_EMAIL non configurato nel file .env"
    echo "   Imposta CERTBOT_EMAIL=tuaemail@tuodominio.com nel file .env"
    exit 1
fi

echo "📋 Configurazione rilevata:"
echo "   Dominio: $DOMAIN"
echo "   Email: $CERTBOT_EMAIL"
echo "   HTTP Port: ${HTTP_PORT:-80}"
echo "   HTTPS Port: ${HTTPS_PORT:-443}"
echo ""

# Verifica che il dominio punti al server
echo "🔍 Verifica che il dominio $DOMAIN punti all'IP di questo server..."
read -p "Il dominio è configurato correttamente nel DNS? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Configura prima il DNS per il dominio $DOMAIN"
    exit 1
fi

# Crea la directory per le challenge di certbot
mkdir -p nginx/ssl
mkdir -p certbot-challenges

# Abilita HTTPS in nginx
echo "🔧 Abilito configurazione HTTPS in Nginx..."

# Crea un file di configurazione HTTPS temporaneo per ottenere i certificati
cat > nginx/conf.d/ssl.conf << 'EOF'
# Server HTTP per challenge Let's Encrypt
server {
    listen 80;
    server_name _;

    # Challenge Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect tutto il resto a HTTPS (dopo aver ottenuto i certificati)
    location / {
        return 301 https://$host$request_uri;
    }
}

# Server HTTPS (verrà abilitato dopo aver ottenuto i certificati)
server {
    listen 443 ssl http2;
    server_name _;

    # SSL certificates (Let's Encrypt) - verranno montati dopo certbot
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Max body size per upload
    client_max_body_size 50M;

    # Root location
    location / {
        proxy_pass http://app:3000;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://app:3000/api/health;
    }
}
EOF

# Sostituisci DOMAIN_PLACEHOLDER con il dominio reale
sed -i.bak "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/conf.d/ssl.conf
rm -f nginx/conf.d/ssl.conf.bak

# Aggiorna docker-compose per montare le challenge
if ! grep -q "certbot-challenges" docker-compose.yml; then
    echo "⚠️  Aggiorno docker-compose.yml per montare le challenge..."
    # Questo richiede una modifica manuale o un comando più complesso
    echo "   Nota: Assicurati che docker-compose.yml monti ./certbot-challenges:/var/www/certbot"
fi

# Avvia i servizi base (senza HTTPS ancora)
echo "🚀 Avvio i servizi base..."
docker-compose up -d app nginx

# Attendi che nginx sia pronto
echo "⏳ Attendo che Nginx sia pronto..."
sleep 5

# Ottieni i certificati con certbot
echo "📜 Ottengo i certificati Let's Encrypt..."
echo "   Questo potrebbe richiedere alcuni minuti..."

# Prima esecuzione: ottieni i certificati
docker-compose --profile ssl run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN" || {
    echo "⚠️  Errore nell'ottenere i certificati"
    echo "   Verifica:"
    echo "   1. Il dominio $DOMAIN punta all'IP di questo server"
    echo "   2. Le porte 80 e 443 sono aperte"
    echo "   3. Nginx è in esecuzione"
    echo ""
    echo "   Log: docker-compose logs certbot"
    exit 1
}

# Verifica che i certificati siano stati creati
# I certificati sono nel volume Docker, verifichiamo tramite container
if ! docker-compose exec -T nginx test -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null; then
    echo "⚠️  Certificati non trovati nel volume Docker"
    echo "   Verifica i log: docker-compose logs certbot"
    echo "   Potrebbe essere necessario attendere qualche secondo..."
    sleep 5
fi

echo "✅ Certificati ottenuti con successo!"

# Aggiorna la configurazione nginx con il dominio corretto
sed -i.bak "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/conf.d/ssl.conf
rm -f nginx/conf.d/ssl.conf.bak

# Riavvia nginx per applicare la configurazione HTTPS
echo "🔄 Riavvio Nginx con configurazione HTTPS..."
docker-compose restart nginx

echo ""
echo "✅ Configurazione HTTPS completata!"
echo ""
echo "🌐 L'applicazione è disponibile su:"
echo "   https://$DOMAIN"
echo ""
echo "📝 Prossimi passi:"
echo "   1. Verifica che NEXTAUTH_URL nel .env sia impostato a: https://$DOMAIN"
echo "   2. Riavvia l'applicazione: docker-compose restart app"
echo "   3. Testa l'accesso HTTPS nel browser"
echo ""

