# Lista delle cose da migliorare - Sa-Ndo-Ka

## Priorità Alta

### Distribuzione Docker e HTTPS
- [ ] Implementare distribuzione dell'applicazione tramite immagine Docker con supporto HTTPS
  - Requisiti fondamentali:
    - Creare Dockerfile ottimizzato per produzione
    - Configurare l'applicazione per essere esposta in HTTPS invece di HTTP
    - Garantire che l'applicazione possa essere eseguita in qualsiasi contesto Docker (standalone, docker-compose, Kubernetes, etc.)
  - Implementazione tecnica:
    - Creare Dockerfile multi-stage per ottimizzare la dimensione dell'immagine
    - Configurare Next.js per produzione con `output: 'standalone'` (già presente)
    - Implementare reverse proxy (nginx o Traefik) per gestire HTTPS
    - Configurare certificati SSL/TLS:
      - Supporto per Let's Encrypt (certbot)
      - Supporto per certificati custom
      - Auto-renewal dei certificati
    - Creare docker-compose.yml per sviluppo e produzione
    - Configurare variabili d'ambiente per:
      - Database (SQLite o PostgreSQL per produzione)
      - NEXTAUTH_URL con HTTPS
      - Configurazioni SMTP
      - Chiavi API esterne
    - Gestire volumi persistenti per:
      - Database
      - Upload di immagini
      - Certificati SSL
  - Documentazione:
    - Creare README con istruzioni per build e deploy
    - Documentare variabili d'ambiente necessarie
    - Fornire esempi di docker-compose per diversi scenari
    - Documentare configurazione HTTPS per diversi provider (Let's Encrypt, Cloudflare, etc.)
  - Testing:
    - Testare build dell'immagine Docker
    - Testare esecuzione in diversi contesti (docker run, docker-compose, Kubernetes)
    - Verificare funzionamento HTTPS end-to-end
    - Testare persistenza dei dati tra riavvii del container

### Integrazione AI per Analisi Immagini e Generazione Dati
- [ ] Implementare sistema di analisi AI per generare descrizioni e completare caratteristiche degli oggetti
  - Funzionalità richiesta:
    - Analisi delle immagini tramite LLM (Large Language Model) con visione
    - Generazione automatica della descrizione dell'oggetto
    - Completamento automatico di tutti i campi caratteristiche/attributi basati sull'immagine
  - Modalità di invio:
    - Analisi per singolo oggetto: invia l'immagine di un singolo oggetto all'AI
    - Analisi per contenitore completo: invia tutte le immagini degli oggetti di un contenitore in batch
  - Implementazione tecnica:
    - Integrare con API di LLM con capacità di visione (es. GPT-4 Vision, Claude con visione, Gemini Vision)
    - Creare prompt strutturato che:
      - Descriva il contesto dell'applicazione
      - Richieda l'analisi dell'immagine
      - Richieda la generazione della descrizione
      - Richieda l'estrazione e il completamento di tutte le caratteristiche/attributi definiti per il tipo di oggetto
    - Gestire il mapping tra i valori estratti dall'AI e i valori validi delle caratteristiche (es. lookup values)
    - Validare i dati generati prima del salvataggio
    - Permettere all'utente di rivedere e modificare i dati generati prima di salvare
  - UI/UX:
    - Aggiungere pulsante "Analizza con AI" nella pagina di creazione/modifica oggetto
    - Aggiungere pulsante "Analizza tutto il contenitore" nella vista contenitore
    - Mostrare stato di caricamento durante l'analisi
    - Mostrare preview dei dati generati prima del salvataggio
    - Permettere di rigenerare se il risultato non è soddisfacente

### Motore di Ricerca Interno
- [ ] Implementare un motore di ricerca interno per trovare oggetti nell'applicazione
  - La ricerca deve cercare in:
    - Tipologia dell'oggetto (ObjectType.name)
    - Descrizione dell'oggetto (Object.description)
    - Caratteristiche dell'oggetto (PropertyValue.value)
    - Nome dell'oggetto (Object.name se presente)
  - I risultati devono indicare:
    - L'oggetto trovato
    - Il contenitore in cui si trova
    - La collezione a cui appartiene il contenitore
  - Esempio: cercando "maglione rosa" deve trovare oggetti con:
    - Tipologia "maglione" o simile
    - Caratteristica "colore" = "rosa"
    - Descrizione contenente "maglione rosa" o "rosa"
  - Implementare ricerca full-text con supporto per:
    - Ricerca parziale (non solo match esatto)
    - Ricerca case-insensitive
    - Possibilmente ricerca fuzzy per gestire errori di digitazione

### Sistema di Collegamento Utenti Invitati
- [ ] Implementare sistema per collegare utenti invitati quando si registrano
  - Problema attuale:
    - Quando si invita un utente non ancora registrato (via email o WhatsApp), viene creata una condivisione con `userId = null`
    - Quando l'utente si registra, la condivisione non viene automaticamente collegata al suo account
  - Soluzione richiesta:
    - Aggiungere campi chiave nel profilo utente:
      - Email (già presente)
      - Numero di telefono (da aggiungere al modello User)
    - Quando un utente si registra:
      - Verificare se esiste una condivisione con `invitedBy` corrispondente alla sua email o numero di telefono
      - Collegare automaticamente la condivisione al nuovo `userId`
      - Aggiornare `accepted` a `true` se la condivisione viene collegata
    - Quando un utente accede:
      - Verificare se ci sono condivisioni pendenti che corrispondono alla sua email o numero di telefono
      - Mostrare notifica o prompt per accettare le condivisioni pendenti
  - Implementazione tecnica:
    - Aggiungere campo `phone` al modello User (opzionale)
    - Creare funzione di matching che cerca condivisioni con `userId = null` e `invitedBy` corrispondente
    - Implementare logica di collegamento automatico durante la registrazione
    - Creare endpoint API per accettare condivisioni pendenti manualmente
    - Aggiornare query delle collezioni per includere anche condivisioni pendenti non ancora accettate

### Condivisione Email
- [ ] Verificare e testare completamente la condivisione via email
  - Testare l'invio effettivo di email con configurazione SMTP
  - Verificare che il link di invito funzioni correttamente
  - Verificare che l'utente invitato possa accedere alla collezione tramite il link
  - Gestire il caso in cui l'utente invitato non è ancora registrato (vedi "Sistema di Collegamento Utenti Invitati")
  - Verificare che l'email contenga tutte le informazioni necessarie (nome collezione, permessi, link di accesso)

### Condivisione WhatsApp
- [ ] Migliorare la modalità di condivisione tramite WhatsApp per rendere i link cliccabili nel messaggio
  - Attualmente i link nel messaggio WhatsApp non sono sempre cliccabili
  - Valutare alternative come:
    - Usare un servizio di URL shortening che genera link cliccabili
    - Implementare un sistema di invio diretto tramite API WhatsApp Business
    - Creare un formato di messaggio più compatibile con WhatsApp

## Priorità Media

### Cestino e Soft Delete
- [ ] Implementare job/cron per la cancellazione fisica automatica dopo 30 giorni
  - Attualmente gli elementi vengono mantenuti nel cestino ma non vengono eliminati fisicamente dopo 30 giorni
  - Creare un endpoint API o un job schedulato che elimina automaticamente i record vecchi

### Sicurezza
- [ ] Crittografare le password SMTP e Twilio nel database
  - Attualmente le password sono salvate in chiaro nel database
  - Implementare crittografia/decrittografia per i dati sensibili

### Performance
- [ ] Ottimizzare le query del database per le collezioni condivise
  - Le query con OR e relazioni multiple potrebbero essere ottimizzate
  - Valutare l'uso di indici aggiuntivi

## Priorità Bassa

### UI/UX
- [ ] Aggiungere conferma modale per eliminazione di contenitori e oggetti
  - Attualmente solo le collezioni hanno il modale di conferma
  - Estendere DeleteConfirmModal anche a contenitori e oggetti

### Funzionalità
- [ ] Implementare ricerca/filtro nelle liste di collezioni, contenitori e oggetti
- [ ] Aggiungere ordinamento personalizzabile (per nome, data creazione, etc.)
- [ ] Implementare esportazione dati (CSV, JSON)

### Documentazione
- [ ] Creare documentazione utente completa
- [ ] Aggiungere tooltip e help text nelle interfacce
- [ ] Creare guida per la configurazione SMTP e Twilio

## Note

*Questo file può essere aggiornato con nuove idee e miglioramenti*

