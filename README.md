<div align="center">
  <img src="docs/images/app-icon.jpg" alt="Sa-Ndo-Ka Logo" width="200" height="200" style="border-radius: 20px;">
  <h1>Sa-Ndo-Ka 🏴‍☠️</h1>
  <p>Sistema di catalogazione intelligente per oggetti con QR code.</p>
</div>

![Hero Image](docs/images/hero-image.jpg)

## Caratteristiche

- 📦 Catalogazione oggetti con tipi personalizzabili e proprietà dinamiche (metamodello)
- 🏷️ QR code per contenitori con link protetto
- 📸 Upload foto da camera/galleria (multiplo)
- 🤖 Analisi AI delle foto (Claude, ChatGPT, Gemini) configurabile per utente
- 👥 Multi-utente con condivisione e permessi (lettura/modifica/cancellazione)
- 📧 Inviti via Email o WhatsApp
- 📄 Generazione PDF per QR code (download e stampa)
- 🐳 Container Docker pronto per NAS Ugreen

## Setup

### Prerequisiti

- Node.js 18+
- npm o yarn

### Installazione

```bash
npm install
```

### Database

```bash
# Genera Prisma Client
npm run db:generate

# Crea database e applica schema
npm run db:push
```

### Variabili d'ambiente

Crea un file `.env`:

```env
DATABASE_URL="file:./sa-ndo-ka.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Opzionali per AI
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_AI_API_KEY=""

# Opzionali per email/WhatsApp
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

### Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Docker

![Docker](docs/images/logout.jpg)

### Build

```bash
docker build -t sa-ndo-ka:latest .
```

### Run locale

```bash
docker run -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/sa-ndo-ka.db:/app/sa-ndo-ka.db \
  -e DATABASE_URL="file:./sa-ndo-ka.db" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  sa-ndo-ka:latest
```

### Export per NAS Ugreen

Usa lo script fornito:

```bash
./build-docker.sh
```

Oppure manualmente:

```bash
docker save sa-ndo-ka:latest | gzip > sa-ndo-ka.tar.gz
```

### Caricamento su NAS

1. Carica il file `sa-ndo-ka.tar.gz` sul tuo NAS
2. Nel pannello Docker del NAS, importa l'immagine
3. Crea un container con:
   - Porta: 3000 (o altra a tua scelta)
   - Volume per uploads: `/app/uploads`
   - Volume per database: `/app/sa-ndo-ka.db`
   - Variabili d'ambiente: vedi `.env.example`

## Licenza

MIT

