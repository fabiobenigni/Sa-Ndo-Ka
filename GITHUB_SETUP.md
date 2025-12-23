# Setup Repository GitHub

## Creazione Repository

1. Vai su GitHub e crea un nuovo repository chiamato `Sa-Ndo-Ka`
2. **NON** inizializzare con README, .gitignore o licenza (già presenti)

## Collegamento Repository Locale

```bash
# Aggiungi il remote (sostituisci con il tuo URL)
git remote add origin https://github.com/TUO-USERNAME/Sa-Ndo-Ka.git

# Rinomina branch principale in main (se necessario)
git branch -M main

# Push del codice
git push -u origin main
```

## Comandi Git Utili

```bash
# Verifica stato
git status

# Aggiungi modifiche
git add .

# Commit
git commit -m "Descrizione modifiche"

# Push
git push

# Pull aggiornamenti
git pull
```

## Branch Protection (Consigliato)

Dopo il primo push, configura la protezione del branch main:
1. Vai su Settings → Branches
2. Aggiungi regola per `main`
3. Richiedi pull request per merge
4. Richiedi review (opzionale)

## GitHub Actions (Opzionale)

Puoi aggiungere CI/CD per:
- Test automatici
- Build Docker automatica
- Deploy automatico

Vedi esempi nella cartella `.github/workflows/` (da creare se necessario).

