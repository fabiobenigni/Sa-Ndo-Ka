# 🚀 Setup Locale - Test Rapido senza Docker

Guida per testare l'app Sa-Ndo-Ka in locale senza Docker.

## Prerequisiti

### 1. Installa Node.js

**Su macOS:**
```bash
# Con Homebrew
brew install node

# Oppure scarica da: https://nodejs.org/
```

**Su Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install nodejs npm
```

**Verifica installazione:**
```bash
node --version  # Dovrebbe essere 18+
npm --version
```

## Setup Rapido

### Opzione 1: Script Automatico (Consigliato)

```bash
# Esegui lo script di setup
./setup-local.sh
```

Lo script:
- ✅ Crea il file `.env` con configurazione base
- ✅ Installa tutte le dipendenze
- ✅ Genera Prisma Client
- ✅ Crea il database SQLite
- ✅ Crea la cartella uploads

### Opzione 2: Manuale

```bash
# 1. Crea file .env
cp .env.example .env

# 2. Modifica .env e aggiungi un secret per NextAuth
# Genera un secret casuale:
openssl rand -base64 32

# 3. Installa dipendenze
npm install

# 4. Genera Prisma Client
npm run db:generate

# 5. Crea database
npm run db:push

# 6. Crea cartella uploads
mkdir -p uploads
touch uploads/.gitkeep
```

## Avvio App

### Modalità Sviluppo (Hot Reload)

```bash
npm run dev
```

L'app sarà disponibile su: **http://localhost:3000**

### Modalità Produzione

```bash
# Build
npm run build

# Avvia server produzione
npm start
```

## Struttura File Importanti

- `.env` - Variabili d'ambiente (non committato)
- `sa-ndo-ka.db` - Database SQLite (creato automaticamente)
- `uploads/` - Cartella per foto caricate
- `node_modules/` - Dipendenze npm

## Troubleshooting

### Errore: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Errore: "Prisma Client not generated"
```bash
npm run db:generate
```

### Errore: "Database not found"
```bash
npm run db:push
```

### Errore: "Port 3000 already in use"
```bash
# Cambia porta nel file .env
NEXTAUTH_URL="http://localhost:3001"

# E avvia con porta diversa
PORT=3001 npm run dev
```

## Comandi Utili

```bash
# Apri Prisma Studio (GUI per database)
npm run db:studio

# Lint codice
npm run lint

# Build produzione
npm run build
```

## Primo Accesso

1. Apri http://localhost:3000
2. Clicca su "Registrati"
3. Crea un account
4. Accedi alla dashboard

## Note

- Il database SQLite è locale: `sa-ndo-ka.db`
- Le foto vengono salvate in: `uploads/`
- Per produzione, usa variabili d'ambiente sicure
- Le chiavi AI sono opzionali (lascia vuote se non le usi)

