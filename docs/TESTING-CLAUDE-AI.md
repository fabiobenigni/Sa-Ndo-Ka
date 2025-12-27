# Guida per Testare l'Integrazione con Claude AI

## Prerequisiti

Per testare l'integrazione con Claude AI, hai bisogno di:

1. **API Key di Anthropic (Claude)**
   - Vai su https://console.anthropic.com/
   - Crea un account o accedi
   - Vai su "API Keys" nel menu
   - Crea una nuova API key
   - Copia la chiave (inizia con `sk-ant-...`)

2. **Account con almeno un Tipo Oggetto configurato**
   - Accedi all'applicazione
   - Vai su Impostazioni → Tipi di Oggetti
   - Crea almeno un tipo di oggetto con alcune proprietà

## Configurazione

1. **Configura la chiave API**
   - Vai su Impostazioni → Configurazione AI
   - Trova la sezione "Anthropic (Claude)"
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
- **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`)
  - Modello consigliato per la maggior parte dei casi d'uso
  - Bilanciamento ottimale tra intelligenza, velocità e costo
  - Supporta vision e analisi immagini

Per cambiare modello, modifica `app/api/ai/analyze/route.ts`:
- `claude-sonnet-4-5-20250929` (consigliato)
- `claude-haiku-4-5-20251001` (più veloce, meno costoso)
- `claude-opus-4-5-20251101` (più intelligente, più costoso)

## Troubleshooting

### Errore: "AI non configurata o non abilitata"
- Verifica che la chiave API sia stata inserita correttamente
- Verifica che il toggle "Abilitato" sia attivo
- Controlla che la chiave API sia valida su https://console.anthropic.com/

### Errore: "Nessun JSON valido trovato nella risposta"
- L'AI potrebbe aver restituito una risposta in formato non JSON
- Verifica i log del server per vedere la risposta completa
- Potrebbe essere necessario migliorare il prompt

### Errore: "Errore nell'analisi AI"
- Controlla i log del server per dettagli sull'errore
- Verifica che l'immagine sia stata caricata correttamente
- Controlla che il tipo di oggetto abbia almeno una proprietà configurata

### L'AI non compila correttamente le proprietà
- Verifica che le proprietà siano configurate correttamente nel tipo di oggetto
- Assicurati che i valori per le proprietà "select" siano chiari e ben definiti
- Prova a migliorare la descrizione del tipo di oggetto

## Costi

Claude Sonnet 4.5:
- Input: $3 per milione di token
- Output: $15 per milione di token
- Vision: Costi aggiuntivi per l'elaborazione delle immagini

Per monitorare i costi:
- Vai su https://console.anthropic.com/settings/usage
- Controlla l'utilizzo e i costi

## Note Tecniche

- L'applicazione converte automaticamente le immagini in base64 per l'invio a Claude
- Il prompt è ottimizzato per restituire JSON strutturato
- L'applicazione prova automaticamente tutti i provider configurati (Anthropic, OpenAI, Google) in ordine di priorità
- I risultati vengono parsati automaticamente e inseriti nel form

## Prossimi Passi

- [ ] Implementare analisi batch per contenitori interi
- [ ] Aggiungere supporto per più immagini per oggetto
- [ ] Migliorare il prompt per risultati più accurati
- [ ] Aggiungere feedback per migliorare i risultati nel tempo

