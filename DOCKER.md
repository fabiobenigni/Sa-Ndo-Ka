# Guida alla Distribuzione Docker - Sa-Ndo-Ka

Questa guida spiega come costruire e distribuire Sa-Ndo-Ka usando Docker.

## Prerequisiti

- Docker Engine 20.10+
- Docker Compose 2.0+
- (Opzionale) Dominio configurato per HTTPS

## Configurazione Rapida

### 1. Configurazione Variabili d'Ambiente

Crea un file `.env` nella root del progetto:

```bash
# Database
DATABASE_URL=file:./data/sa-ndo-ka.db

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
# NEXTAUTH_URL può essere impostato manualmente o rilevato automaticamente
# Vedi la sezione "Configurazione URL" per maggiori dettagli
NEXTAUTH_URL=

# Porte (opzionale)
HTTP_PORT=80
HTTPS_PORT=443

# Dominio per HTTPS (opzionale)
DOMAIN=yourdomain.com
CERTBOT_EMAIL=admin@yourdomain.com
```

### Configurazione URL (NEXTAUTH_URL)

L'applicazione può essere accessibile tramite diversi indirizzi:
- **localhost** (sviluppo locale)
- **IP della macchina** (es. `http://192.168.1.100`)
- **Nome host** (es. `http://nas.local`)
- **Dominio** (es. `https://miodominio.com`)

#### Opzione 1: Rilevamento Automatico (Consigliato)

Se `NEXTAUTH_URL` non è impostato o è vuoto, l'applicazione tenta di rilevarlo automaticamente:

```bash
# Lascia NEXTAUTH_URL vuoto o non impostarlo
NEXTAUTH_URL=
```

Lo script di rilevamento automatico:
1. Cerca di ottenere l'IP della macchina host
2. Usa la variabile `DOMAIN` se disponibile
3. Usa le porte `HTTP_PORT` o `HTTPS_PORT` se configurate
4. Fallback a `http://localhost:80` se niente altro funziona

#### Opzione 2: Configurazione Manuale

Imposta manualmente `NEXTAUTH_URL` nel file `.env`:

**Per accesso tramite IP:**
```bash
NEXTAUTH_URL=http://192.168.1.100
# Oppure con porta personalizzata
NEXTAUTH_URL=http://192.168.1.100:8080
```

**Per accesso tramite nome host:**
```bash
NEXTAUTH_URL=http://nas.local
# Oppure con porta personalizzata
NEXTAUTH_URL=http://nas.local:3000
```

**Per accesso tramite dominio con HTTPS:**
```bash
NEXTAUTH_URL=https://miodominio.com
# Assicurati di configurare anche HTTPS_PORT e DOMAIN
HTTPS_PORT=443
DOMAIN=miodominio.com
```

**Per sviluppo locale:**
```bash
NEXTAUTH_URL=http://localhost:3000
```

#### Verifica della Configurazione

Dopo l'avvio, controlla i log per vedere quale URL è stato rilevato:

```bash
docker-compose logs app | grep NEXTAUTH_URL
```

Dovresti vedere un messaggio come:
```
NEXTAUTH_URL rilevato automaticamente: http://192.168.1.100
```

### 2. Build e Avvio

```bash
# Build dell'immagine
docker-compose build

# Avvia i container
docker-compose up -d

# Visualizza i log
docker-compose logs -f
```

L'applicazione sarà disponibile su `http://localhost` (o sulla porta specificata).

## Configurazione HTTPS

### Opzione 1: Let's Encrypt (Consigliata per Produzione)

1. Configura il dominio nel file `.env`:
```bash
DOMAIN=yourdomain.com
CERTBOT_EMAIL=admin@yourdomain.com
```

2. Decommenta la configurazione HTTPS in `nginx/conf.d/default.conf`

3. Genera i certificati:
```bash
docker-compose --profile ssl run --rm certbot
```

4. Riavvia nginx:
```bash
docker-compose restart nginx
```

5. Configura il rinnovo automatico (cron job):
```bash
# Aggiungi al crontab del host
0 0 * * * cd /path/to/sa-ndo-ka && docker-compose --profile ssl run --rm certbot renew && docker-compose restart nginx
```

### Opzione 2: Certificati Custom

1. Posiziona i certificati in `nginx/ssl/`:
   - `fullchain.pem` (certificato completo)
   - `privkey.pem` (chiave privata)

2. Decommenta e modifica la configurazione HTTPS in `nginx/conf.d/default.conf`:
```nginx
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

3. Riavvia nginx:
```bash
docker-compose restart nginx
```

## Volumi Persistenti

I seguenti dati sono salvati in volumi persistenti:

- **Database**: `./data/sa-ndo-ka.db` - Database SQLite
- **Uploads**: `./uploads/` - Immagini caricate dagli utenti
- **Certificati SSL**: `./nginx/ssl/` - Certificati SSL custom

**Importante**: Fai backup regolari di questi volumi!

## Comandi Utili

```bash
# Build dell'immagine
docker-compose build

# Avvia i container
docker-compose up -d

# Ferma i container
docker-compose down

# Visualizza i log
docker-compose logs -f app
docker-compose logs -f nginx

# Riavvia un servizio
docker-compose restart app
docker-compose restart nginx

# Entra nel container
docker-compose exec app sh

# Esegui comandi Prisma
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma db push

# Rimuovi tutto (ATTENZIONE: cancella i volumi!)
docker-compose down -v
```

## Troubleshooting

### Database non si inizializza

```bash
# Entra nel container e inizializza manualmente
docker-compose exec app sh
cd /app
npx prisma db push
```

### Problemi con gli uploads

Verifica i permessi:
```bash
chmod -R 755 uploads/
chown -R $(id -u):$(id -g) uploads/
```

### Problemi con HTTPS

1. Verifica che le porte 80 e 443 siano aperte
2. Controlla i log di nginx: `docker-compose logs nginx`
3. Verifica che i certificati siano presenti e validi

### Container non si avvia

Controlla i log:
```bash
docker-compose logs app
docker-compose logs nginx
```

## Produzione

Per la produzione, assicurati di:

1. ✅ Cambiare `NEXTAUTH_SECRET` con una chiave sicura
2. ✅ Configurare `NEXTAUTH_URL` con il dominio corretto (o lasciare vuoto per rilevamento automatico)
3. ✅ Abilitare HTTPS con Let's Encrypt
4. ✅ Configurare backup automatici del database
5. ✅ Monitorare i log e le performance
6. ✅ Configurare firewall per limitare accesso alle porte
7. ✅ Verificare che l'applicazione sia accessibile dall'esterno se necessario

## Build Standalone

Per creare solo l'immagine dell'app (senza nginx):

```bash
docker build -t sa-ndo-ka:latest .
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  sa-ndo-ka:latest
```

## Note

- Il database SQLite è salvato in `./data/sa-ndo-ka.db`
- Gli uploads sono salvati in `./uploads/`
- L'applicazione usa Next.js standalone mode per ottimizzare la dimensione dell'immagine
- Nginx gestisce HTTPS e reverse proxy
- Health check endpoint disponibile su `/api/health`

