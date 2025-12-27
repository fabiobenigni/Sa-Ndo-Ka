# Guida per Testare l'Integrazione con Google Gemini AI

## Prerequisiti

Per testare l'integrazione con Google Gemini AI, hai bisogno di:

1. **API Key di Google Gemini**
   - Vai su https://ai.google.dev/ o https://makersuite.google.com/app/apikey
   - Accedi con il tuo account Google
   - Clicca su "Get API Key" o "Crea API Key"
   - Se non hai ancora un progetto Google Cloud, ne verrà creato uno automaticamente
   - Copia la chiave API (inizia con `AIza...`)

2. **Account con almeno un Tipo Oggetto configurato**
   - Accedi all'applicazione
   - Vai su Impostazioni → Tipi di Oggetti
   - Crea almeno un tipo di oggetto con alcune proprietà

## Configurazione

1. **Configura la chiave API**
   - Vai su Impostazioni → Configurazione AI
   - Trova la sezione "Google (Gemini)"
   - Incolla la tua API key nel campo "API Key"
   - Attiva il toggle "Abilitato"
   - Salva

## Come Testare

### Test Base: Analisi di un Oggetto Singolo

1. **Crea un contenitore**
   - Vai alla Home Page
   - Seleziona una collezione o creane una nuova
   - Crea un contenitore

2. **Aggiungi un oggetto**
   - Clicca su "+ Aggiungi" nel contenitore
   - Seleziona un tipo di oggetto
   - Carica una foto (usa un'immagine chiara dell'oggetto)
   - Clicca su "🔍 Analizza con AI"

3. **Verifica i risultati**
   - L'AI dovrebbe generare:
     - Una descrizione dell'oggetto
     - I valori per le proprietà configurate
   - Controlla che i valori siano corretti e coerenti

### Test Avanzati

#### Test con diversi tipi di oggetti
- Prova con oggetti diversi (vestiti, libri, elettronica, ecc.)
- Verifica che l'AI riconosca correttamente il tipo e compili le proprietà appropriate

#### Test con immagini di qualità diversa
- Prova con foto ad alta risoluzione
- Prova con foto a bassa risoluzione
- Prova con foto in condizioni di luce diverse

#### Test con proprietà complesse
- Crea un tipo di oggetto con molte proprietà
- Verifica che l'AI compili correttamente tutte le proprietà
- Testa con proprietà di tipo "select" e verifica che usi i valori corretti

## Modelli Disponibili

L'applicazione usa attualmente:
- **Gemini 2.5 Flash** (`gemini-2.5-flash`)
  - Modello consigliato per la maggior parte dei casi d'uso
  - Bilanciamento ottimale tra intelligenza, velocità e costo
  - Supporta vision e analisi immagini
  - Context window: 1M token
  - Output: 65K token

Per cambiare modello, modifica `app/api/ai/analyze/route.ts`:
- `gemini-2.5-flash` (consigliato, stabile)
- `gemini-3-flash-preview` (più recente, preview)
- `gemini-2.5-pro` (più intelligente, più costoso)
- `gemini-2.5-flash-lite` (più veloce ed economico)

## Troubleshooting

### Errore: "AI non configurata o non abilitata"
- Verifica che la chiave API sia stata inserita correttamente
- Verifica che il toggle "Abilitato" sia attivo
- Controlla che la chiave API sia valida su https://ai.google.dev/

### Errore: "Nessun JSON valido trovato nella risposta"
- L'AI potrebbe aver restituito una risposta in formato non JSON
- Verifica i log del server per vedere la risposta completa
- Potrebbe essere necessario migliorare il prompt

### Errore: "Errore nell'analisi AI"
- Controlla i log del server per dettagli sull'errore
- Verifica che l'immagine sia stata caricata correttamente
- Controlla che il tipo di oggetto abbia almeno una proprietà configurata
- Verifica che la chiave API abbia i permessi corretti

### L'AI non compila correttamente le proprietà
- Verifica che le proprietà siano configurate correttamente nel tipo di oggetto
- Assicurati che i valori per le proprietà "select" siano chiari e ben definiti
- Prova a migliorare la descrizione del tipo di oggetto

### Problemi con immagini
- Gemini supporta immagini in formato base64 o URL pubblici
- Se usi URL relativi, assicurati che siano accessibili pubblicamente
- L'applicazione converte automaticamente le immagini in base64 per garantire la compatibilità

## Costi

Gemini 2.5 Flash:
- Input: $0.30 per milione di token (fino a 200K), poi $0.60 per milione di token
- Output: $2.50 per milione di token (fino a 200K), poi $5.00 per milione di token
- Vision: Costi aggiuntivi per l'elaborazione delle immagini

**Nota:** Google offre un tier gratuito generoso per iniziare. Controlla la pagina dei prezzi per i dettagli aggiornati.

Per monitorare i costi:
- Vai su https://console.cloud.google.com/
- Seleziona il tuo progetto
- Vai su "Billing" per vedere l'utilizzo e i costi

## Note Tecniche

- L'applicazione converte automaticamente le immagini in base64 per l'invio a Gemini
- Il prompt è ottimizzato per restituire JSON strutturato
- L'applicazione prova automaticamente tutti i provider configurati (Anthropic, OpenAI, Google) in ordine di priorità
- I risultati vengono parsati automaticamente e inseriti nel form
- Gemini supporta anche URL pubblici per le immagini, ma il base64 è più affidabile

## Vantaggi di Gemini

- **Gratuito per iniziare**: Tier gratuito generoso
- **Multimodale avanzato**: Eccellente comprensione di immagini, testo, video e audio
- **Context window ampio**: Fino a 1M token per Gemini 2.5 Flash
- **Velocità**: Gemini Flash è molto veloce rispetto ad altri modelli
- **Costi contenuti**: Prezzi competitivi per l'uso in produzione

## Prossimi Passi

- [ ] Implementare analisi batch per contenitori interi
- [ ] Aggiungere supporto per più immagini per oggetto
- [ ] Migliorare il prompt per risultati più accurati
- [ ] Aggiungere feedback per migliorare i risultati nel tempo
- [ ] Esplorare l'uso di Gemini Pro per compiti più complessi

