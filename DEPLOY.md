# Guida al Deploy di Sa-Ndo-Ka

## Prerequisiti

- Node.js 18+ (per sviluppo locale)
- Docker (per produzione)
- NAS Ugreen con supporto Docker

## Setup Iniziale

### 1. Clona il repository

```bash
git clone <repository-url>
cd Sa-Ndo-Ka
```

### 2. Installa dipendenze

```bash
npm install
```

### 3. Configura variabili d'ambiente

Copia `.env.example` in `.env` e modifica i valori:

```bash
cp .env.example .env
```

### 4. Inizializza database

```bash
npm run db:generate
npm run db:push
```

## Sviluppo Locale

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

## Build per Produzione

### 1. Build immagine Docker

```bash
docker build -t sa-ndo-ka:latest .
```

### 2. Test locale

```bash
docker run -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/sa-ndo-ka.db:/app/sa-ndo-ka.db \
  -e DATABASE_URL="file:./sa-ndo-ka.db" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  sa-ndo-ka:latest
```

### 3. Export per NAS

```bash
./build-docker.sh
```

Questo creerà `sa-ndo-ka.tar.gz` pronto per il caricamento sul NAS.

## Deploy su NAS Ugreen

### Metodo 1: Via interfaccia web NAS

1. Accedi al pannello di controllo del NAS
2. Vai alla sezione Docker/Container
3. Clicca su "Import Image" o "Load Image"
4. Seleziona il file `sa-ndo-ka.tar.gz`
5. Attendi il caricamento

### Metodo 2: Via SSH

```bash
# Carica il file sul NAS (esempio con scp)
scp sa-ndo-ka.tar.gz user@nas-ip:/path/to/docker/

# Connettiti al NAS via SSH
ssh user@nas-ip

# Carica l'immagine Docker
docker load -i /path/to/docker/sa-ndo-ka.tar.gz
```

### Creazione Container

Dopo aver caricato l'immagine, crea un container con:

**Volumi:**
- `/app/uploads` → `/path/on/nas/uploads` (per le foto)
- `/app/sa-ndo-ka.db` → `/path/on/nas/sa-ndo-ka.db` (per il database)

**Porte:**
- `3000:3000` (o altra porta a tua scelta)

**Variabili d'ambiente:**
```
DATABASE_URL=file:./sa-ndo-ka.db
NEXTAUTH_SECRET=<genera-un-secret-random>
NEXTAUTH_URL=http://<nas-ip>:<porta>
```

**Esempio comando completo:**

```bash
docker run -d \
  --name sa-ndo-ka \
  -p 3000:3000 \
  -v /volume1/docker/sa-ndo-ka/uploads:/app/uploads \
  -v /volume1/docker/sa-ndo-ka/db:/app \
  -e DATABASE_URL="file:./sa-ndo-ka.db" \
  -e NEXTAUTH_SECRET="your-random-secret-here" \
  -e NEXTAUTH_URL="http://192.168.1.100:3000" \
  --restart unless-stopped \
  sa-ndo-ka:latest
```

## Configurazione AI (Opzionale)

Per abilitare l'analisi AI delle foto:

1. Crea account su uno o più provider:
   - OpenAI: https://platform.openai.com
   - Anthropic: https://www.anthropic.com
   - Google AI: https://makersuite.google.com/app/apikey

2. Inserisci le API key nelle variabili d'ambiente o configurale dall'app dopo il login

3. Abilita l'AI nelle impostazioni utente

## Configurazione Email/WhatsApp (Opzionale)

Per gli inviti:

### Email (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### WhatsApp (Twilio)
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=whatsapp:+1234567890
```

## Backup

Esegui backup regolari del database:

```bash
# Backup database
cp /path/to/sa-ndo-ka.db /path/to/backup/sa-ndo-ka-$(date +%Y%m%d).db

# Backup uploads
tar -czf /path/to/backup/uploads-$(date +%Y%m%d).tar.gz /path/to/uploads/
```

## Troubleshooting

### Container non si avvia
- Verifica i log: `docker logs sa-ndo-ka`
- Controlla le variabili d'ambiente
- Verifica i permessi sui volumi

### Database non trovato
- Assicurati che il volume del database sia montato correttamente
- Verifica che il percorso sia corretto

### Foto non vengono caricate
- Verifica i permessi sulla cartella uploads
- Controlla che il volume sia montato correttamente

### QR code non funziona
- Verifica che `NEXTAUTH_URL` corrisponda all'URL effettivo del NAS
- Controlla che la porta sia accessibile dalla rete

## Supporto

Per problemi o domande, apri una issue sul repository GitHub.

