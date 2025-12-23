#!/bin/bash

# Script per collegare il repository locale a GitHub

set -e

REPO_NAME="Sa-Ndo-Ka"
GITHUB_USER="${GITHUB_USER:-fabiobenigni}"  # Modifica se il tuo username è diverso

echo "🔗 Collegamento repository a GitHub..."
echo ""

# Verifica se il remote esiste già
if git remote get-url origin 2>/dev/null >/dev/null 2>&1; then
    echo "⚠️  Remote 'origin' già configurato:"
    git remote -v
    read -p "Vuoi sovrascriverlo? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operazione annullata"
        exit 1
    fi
    git remote remove origin
fi

# Chiedi username GitHub se non impostato
if [ -z "$GITHUB_USER" ] || [ "$GITHUB_USER" == "fabiobenigni" ]; then
    read -p "Inserisci il tuo username GitHub: " GITHUB_USER
fi

# Verifica se il repository esiste
echo "🔍 Verifica esistenza repository su GitHub..."
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}" | grep -q "200\|404"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}")
    
    if [ "$HTTP_CODE" == "404" ]; then
        echo "❌ Repository non trovato su GitHub!"
        echo ""
        echo "Crea il repository prima di continuare:"
        echo "1. Vai su https://github.com/new"
        echo "2. Nome repository: ${REPO_NAME}"
        echo "3. NON inizializzare con README, .gitignore o licenza"
        echo "4. Clicca 'Create repository'"
        echo ""
        read -p "Premi INVIO quando hai creato il repository..."
    fi
fi

# Aggiungi remote
echo "➕ Aggiunta remote 'origin'..."
git remote add origin "${REPO_URL}"

# Verifica connessione
echo "🔐 Verifica connessione..."
if git ls-remote --heads origin 2>/dev/null | grep -q "."; then
    echo "✅ Connessione riuscita!"
else
    echo "⚠️  Impossibile verificare la connessione. Il repository potrebbe essere privato o richiedere autenticazione."
fi

# Push
echo ""
read -p "Vuoi fare il push del codice ora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Push codice su GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successo! Repository collegato e codice caricato."
        echo "🌐 Visualizza su: https://github.com/${GITHUB_USER}/${REPO_NAME}"
    else
        echo ""
        echo "❌ Errore durante il push. Verifica le credenziali GitHub."
        echo "💡 Suggerimento: usa 'git push -u origin main' manualmente dopo aver configurato l'autenticazione."
    fi
else
    echo ""
    echo "📝 Remote configurato. Esegui manualmente:"
    echo "   git push -u origin main"
fi

echo ""
echo "✅ Completato!"

