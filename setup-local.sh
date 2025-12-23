#!/bin/bash

echo "🚀 Setup locale Sa-Ndo-Ka"
echo "=========================="
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installa Node.js 18+ prima di continuare."
    exit 1
fi

echo "✅ Node.js trovato: $(node --version)"
echo ""

# Crea .env se non esiste
if [ ! -f .env ]; then
    echo "📝 Creo file .env da .env.example..."
    cp .env.example .env
    # Genera un secret casuale per NextAuth
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-here-change-this-in-production/$SECRET/" .env
    else
        # Linux
        sed -i "s/your-secret-key-here-change-this-in-production/$SECRET/" .env
    fi
    echo "✅ File .env creato con secret generato automaticamente"
else
    echo "ℹ️  File .env già esistente"
fi
echo ""

# Installa dipendenze
if [ ! -d "node_modules" ]; then
    echo "📦 Installo dipendenze npm..."
    npm install
    echo "✅ Dipendenze installate"
else
    echo "ℹ️  node_modules già presente"
fi
echo ""

# Genera Prisma Client
echo "🔧 Genero Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generato"
echo ""

# Crea database se non esiste
if [ ! -f "sa-ndo-ka.db" ]; then
    echo "💾 Creo database SQLite..."
    npx prisma db push
    echo "✅ Database creato"
else
    echo "ℹ️  Database già esistente"
fi
echo ""

# Crea cartella uploads se non esiste
if [ ! -d "uploads" ]; then
    echo "📁 Creo cartella uploads..."
    mkdir -p uploads
    touch uploads/.gitkeep
    echo "✅ Cartella uploads creata"
else
    echo "ℹ️  Cartella uploads già esistente"
fi
echo ""

echo "✅ Setup completato!"
echo ""
echo "Per avviare l'app in modalità sviluppo:"
echo "  npm run dev"
echo ""
echo "L'app sarà disponibile su: http://localhost:3000"
echo ""

