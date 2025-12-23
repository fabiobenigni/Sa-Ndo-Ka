# Sa-Ndo-Ka 🏴‍☠️

Sistema di catalogazione intelligente per oggetti con QR code.

## Caratteristiche

- 📦 Catalogazione oggetti con tipi personalizzabili
- 🏷️ QR code per contenitori
- 📸 Upload foto da camera/galleria
- 🤖 Analisi AI delle foto (Claude, ChatGPT, Gemini)
- 👥 Multi-utente con condivisione e permessi
- 🌍 Multi-lingua (basato su browser)
- 📄 Generazione PDF per QR code

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

### Build

```bash
docker build -t sa-ndo-ka:latest .
```

### Run

```bash
docker run -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/sa-ndo-ka.db:/app/sa-ndo-ka.db \
  sa-ndo-ka:latest
```

### Export per NAS

```bash
docker save sa-ndo-ka:latest | gzip > sa-ndo-ka.tar.gz
```

## Licenza

MIT

