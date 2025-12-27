# Guida alla Configurazione HTTPS per Sa-Ndo-Ka

Questa guida spiega come configurare HTTPS per Sa-Ndo-Ka usando Docker, Nginx e Let's Encrypt.

## Prerequisiti

1. **Dominio configurato**: Devi avere un dominio (es. `miodominio.com`) che punta all'IP del tuo server
2. **Porte aperte**: Le porte 80 (HTTP) e 443 (HTTPS) devono essere aperte nel firewall
3. **Docker e Docker Compose**: Installati e funzionanti

## Configurazione Rapida

### 1. Configura il file `.env`

Assicurati che il file `.env` contenga:

```bash
# Dominio per HTTPS
DOMAIN=miodominio.com
CERTBOT_EMAIL=tuaemail@miodominio.com

# Porte
HTTP_PORT=80
HTTPS_PORT=443

# NextAuth URL (IMPORTANTE: usa HTTPS!)
NEXTAUTH_URL=https://miodominio.com

# Altri parametri...
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=file:./data/sa-ndo-ka.db
```

### 2. Esegui lo script di configurazione

```bash
./scripts/setup-https.sh
```

Lo script:
- Verifica la configurazione
- Abilita HTTPS in Nginx
- Ottiene i certificati Let's Encrypt
- Configura il redirect HTTP → HTTPS

### 3. Verifica la configurazione

Dopo l'esecuzione, verifica che tutto funzioni:

```bash
# Controlla i log
docker-compose logs nginx
docker-compose logs certbot

# Testa HTTPS
curl -I https://miodominio.com
```

## Configurazione Manuale

Se preferisci configurare manualmente:

### Passo 1: Abilita HTTPS in Nginx

Modifica `nginx/conf.d/default.conf` e decommenta la sezione HTTPS:

```nginx
# Server HTTP - Redirect a HTTPS
server {
    listen 80;
    server_name _;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# Server HTTPS
server {
    listen 443 ssl http2;
    server_name _;
    
    ssl_certificate /etc/letsencrypt/live/miodominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/miodominio.com/privkey.pem;
    
    # ... resto della configurazione
}
```

### Passo 2: Ottieni i certificati

```bash
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email tuaemail@miodominio.com \
    --agree-tos \
    --no-eff-email \
    -d miodominio.com
```

### Passo 3: Riavvia i servizi

```bash
docker-compose restart nginx app
```

## Rinnovo Automatico dei Certificati

I certificati Let's Encrypt scadono ogni 90 giorni. Per rinnovarli automaticamente:

### Opzione 1: Cron Job

Aggiungi al crontab del server:

```bash
0 3 * * * cd /path/to/sa-ndo-ka && docker-compose run --rm certbot renew && docker-compose restart nginx
```

### Opzione 2: Container Certbot con Rinnovo Automatico

Modifica `docker-compose.yml` per aggiungere un servizio di rinnovo:

```yaml
certbot-renew:
  image: certbot/certbot:latest
  container_name: sa-ndo-ka-certbot-renew
  volumes:
    - certbot-certs:/etc/letsencrypt
    - certbot-challenges:/var/www/certbot
  command: certbot renew --webroot --webroot-path=/var/www/certbot
  restart: unless-stopped
```

## Troubleshooting

### Errore: "Domain not found"
- Verifica che il dominio punti correttamente all'IP del server
- Usa `dig miodominio.com` o `nslookup miodominio.com` per verificare

### Errore: "Port 80 already in use"
- Verifica che nessun altro servizio stia usando la porta 80
- Usa `sudo lsof -i :80` per vedere chi usa la porta

### Certificati non trovati
- Verifica che i certificati siano stati creati: `ls -la certbot-certs/live/miodominio.com/`
- Controlla i log: `docker-compose logs certbot`

### HTTPS non funziona dopo la configurazione
- Verifica che NEXTAUTH_URL sia impostato a `https://miodominio.com`
- Riavvia l'app: `docker-compose restart app`
- Controlla i log di Nginx: `docker-compose logs nginx`

## Note Importanti

1. **NEXTAUTH_URL**: Deve essere impostato a `https://miodominio.com` (non `http://`)
2. **Prima volta**: La prima volta che ottieni i certificati, potrebbe essere necessario accettare i termini di Let's Encrypt
3. **Rate Limits**: Let's Encrypt ha limiti di rate. Non eseguire lo script troppe volte in breve tempo
4. **Test**: Dopo la configurazione, testa sempre l'accesso HTTPS nel browser

## Supporto

Per problemi o domande, consulta:
- [Documentazione Let's Encrypt](https://letsencrypt.org/docs/)
- [Documentazione Nginx SSL](https://nginx.org/en/docs/http/configuring_https_servers.html)
- Log del progetto: `docker-compose logs`

