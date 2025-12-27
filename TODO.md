# Lista delle cose da migliorare - Sa-Ndo-Ka

## Priorità Alta

### Compatibilità Mobile
- [x] Migliorare l'esperienza utente su dispositivi mobili ✅ **IMPLEMENTATO**
  - Supporto fotocamera: ✅ **COMPLETATO**
    - ✅ Aggiunto `capture="environment"` agli input file per accesso diretto alla fotocamera posteriore
    - ✅ Funziona su iOS e Android quando si caricano immagini
  - Leggibilità form su mobile: ✅ **COMPLETATO**
    - ✅ Risolto problema leggibilità password su mobile (iOS Safari e Chrome Android)
    - ✅ Aggiunto CSS con `-webkit-text-fill-color` per forzare colore testo su mobile
    - ✅ Aggiunto `font-size: 16px` per prevenire zoom automatico su iOS
    - ✅ Migliorato supporto autofill con stili specifici per `-webkit-autofill`
    - ✅ Aggiunto `text-gray-900 bg-white` a tutti gli input, textarea e select
  - Login tramite IP da mobile: ✅ **COMPLETATO**
    - ✅ Implementato rilevamento dinamico URL dalla richiesta per supportare accesso tramite IP
    - ✅ Configurazione cookie ottimizzata per funzionare con IP su HTTP (senza sameSite su HTTP)
    - ✅ Risolto problema redirect dopo login usando `window.location.href` invece di `router.push`
    - ✅ Testato e funzionante su Chrome Android
  - Note: L'applicazione è ora completamente utilizzabile su dispositivi mobili, sia con localhost che con IP di rete. La fotocamera è accessibile direttamente quando si caricano immagini. Tutti i form sono leggibili e funzionanti su mobile.

### Distribuzione Docker e HTTPS
- [x] Implementare distribuzione dell'applicazione tramite immagine Docker con supporto HTTPS ✅ **IMPLEMENTATO**
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
  - Documentazione: ✅ **COMPLETATO**
    - ✅ Creato README con istruzioni per build e deploy
    - ✅ Creato DOCKER.md con documentazione completa
    - ✅ Documentate variabili d'ambiente necessarie
    - ✅ Forniti esempi di docker-compose per diversi scenari
    - ✅ Documentata configurazione HTTPS con Let's Encrypt e Certbot
  - Testing: ✅ **COMPLETATO**
    - ✅ Testato build dell'immagine Docker
    - ✅ Testato esecuzione con docker-compose
    - ✅ Verificato funzionamento HTTP (HTTPS configurabile con Certbot)
    - ✅ Testata persistenza dei dati tra riavvii del container
    - ✅ Testato build per architettura AMD64 (compatibile con NAS)
    - ✅ Testato export immagine Docker in formato TAR per deployment NAS
  - Script e tooling: ✅ **COMPLETATO**
    - ✅ Script `build-docker.sh` per build e export immagine Docker AMD64
    - ✅ Script `create-deployment-tar.sh` per creare archivio TAR sorgenti
    - ✅ Configurazione Prisma binaryTargets per supportare AMD64 e ARM64
    - ✅ Documentazione deployment in `deploy/README-DEPLOY.md` e `deploy/QUICK-START.md`
  - Note: L'applicazione è completamente funzionante in Docker con supporto per IP, hostname e domini. L'immagine Docker è configurata per AMD64 (compatibile con la maggior parte dei NAS). HTTPS può essere configurato tramite Certbot seguendo le istruzioni in DOCKER.md. L'immagine può essere esportata in formato TAR e caricata direttamente sul NAS tramite `docker load`.

### Integrazione AI per Analisi Immagini e Generazione Dati
- [x] Implementare sistema di analisi AI per generare descrizioni e completare caratteristiche degli oggetti ⚠️ **PARZIALMENTE IMPLEMENTATO**
  - Funzionalità richiesta:
    - Analisi delle immagini tramite LLM (Large Language Model) con visione
    - Generazione automatica della descrizione dell'oggetto
    - Completamento automatico di tutti i campi caratteristiche/attributi basati sull'immagine
  - Modalità di invio:
    - ✅ Analisi per singolo oggetto: IMPLEMENTATO - Pulsante "Analizza con AI" in ObjectForm
    - ❌ Analisi per contenitore completo: NON IMPLEMENTATO - Da aggiungere nella vista contenitore
  - Implementazione tecnica: ✅ **COMPLETATO**
    - ✅ Integrato con API di LLM con capacità di visione (OpenAI GPT-4 Vision, Anthropic Claude, Google Gemini)
    - ✅ Creato prompt strutturato per analisi immagini
    - ✅ Gestito mapping tra valori estratti dall'AI e caratteristiche
    - ✅ Validazione dati generati prima del salvataggio
    - ✅ Permesso all'utente di rivedere e modificare i dati generati prima di salvare
  - UI/UX: ⚠️ **PARZIALMENTE COMPLETATO**
    - ✅ Aggiunto pulsante "Analizza con AI" nella pagina di creazione/modifica oggetto
    - ❌ Aggiungere pulsante "Analizza tutto il contenitore" nella vista contenitore
    - ✅ Mostrato stato di caricamento durante l'analisi
    - ✅ Mostrato preview dei dati generati prima del salvataggio
    - ✅ Permesso di rigenerare se il risultato non è soddisfacente
  - Note: L'analisi AI funziona correttamente per singoli oggetti. Manca l'implementazione dell'analisi batch per contenitori interi.

### Motore di Ricerca Interno
- [x] Implementare un motore di ricerca interno per trovare oggetti nell'applicazione ✅ **IMPLEMENTATO**
  - La ricerca cerca in: ✅ **IMPLEMENTATO**
    - ✅ Tipologia dell'oggetto (ObjectType.name)
    - ✅ Descrizione dell'oggetto (Object.description)
    - ✅ Caratteristiche dell'oggetto (ObjectProperty.value)
    - ✅ Nome dell'oggetto (Object.name)
  - I risultati indicano: ✅ **IMPLEMENTATO**
    - ✅ L'oggetto trovato con campo di match evidenziato
    - ✅ Il contenitore in cui si trova
    - ✅ La collezione a cui appartiene il contenitore
    - ✅ Indicazione se la collezione è condivisa
  - Implementazione ricerca: ✅ **COMPLETATO**
    - ✅ Ricerca parziale (LIKE con %query%)
    - ✅ Ricerca case-insensitive
    - ✅ Ricerca con partizionamento per utente (solo oggetti accessibili)
    - ✅ Supporto per collezioni condivise
    - ✅ UI con SearchBar nel layout e pagina dedicata /dashboard/search
  - Note: Il motore di ricerca è completamente funzionante. Cerca in tutti i campi richiesti e mostra risultati con contesto completo (collezione, contenitore, campo di match).

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
- [x] Verificare e testare completamente la condivisione via email ⚠️ **IMPLEMENTATO - DA TESTARE COMPLETAMENTE**
  - ✅ Implementato invio email con configurazione SMTP (Nodemailer)
  - ✅ Configurazione SMTP disponibile nel pannello "Configurazione App"
  - ⚠️ Da testare: invio effettivo di email con configurazione SMTP reale
  - ⚠️ Da verificare: link di invito funzionante
  - ⚠️ Da verificare: accesso utente invitato alla collezione tramite link
  - ❌ Da implementare: gestione utente non registrato (vedi "Sistema di Collegamento Utenti Invitati")
  - ✅ Email contiene informazioni necessarie (nome collezione, permessi, link di accesso)

### Condivisione WhatsApp
- [x] Migliorare la modalità di condivisione tramite WhatsApp per rendere i link cliccabili nel messaggio ⚠️ **IMPLEMENTATO - DA MIGLIORARE**
  - ✅ Implementata condivisione tramite link `wa.me` con messaggio pre-compilato
  - ✅ Link generato con formattazione migliorata per renderlo cliccabile
  - ⚠️ I link possono non essere sempre cliccabili in WhatsApp (limitazione della piattaforma)
  - Valutare alternative future:
    - Usare un servizio di URL shortening che genera link cliccabili
    - Implementare un sistema di invio diretto tramite API WhatsApp Business
    - Creare un formato di messaggio più compatibile con WhatsApp

## Priorità Media

### Cestino e Soft Delete
- [x] Implementare job/cron per la cancellazione fisica automatica dopo 30 giorni ⚠️ **SOFT DELETE IMPLEMENTATO - MANCA JOB AUTOMATICO**
  - ✅ Implementato soft delete completo per collezioni, contenitori e oggetti
  - ✅ Implementato cestino con funzionalità di ripristino e eliminazione definitiva
  - ✅ Implementato cascade delete logico (eliminare collezione elimina contenitori e oggetti)
  - ✅ Creata funzione `permanentlyDeleteOldTrashItems` in `lib/soft-delete.ts`
  - ❌ Manca job/cron automatico per cancellazione fisica dopo 30 giorni
  - Note: La funzione per eliminare elementi vecchi esiste ma deve essere chiamata manualmente o tramite job schedulato esterno

### Sicurezza
- [x] Crittografare le password SMTP nel database ⚠️ **PARZIALMENTE IMPLEMENTATO**
  - ✅ Implementata crittografia per chiavi API AI (AES-256-CBC)
  - ⚠️ Password SMTP attualmente salvate in chiaro nel database
  - ✅ Funzioni di crittografia/decrittografia disponibili (usate per AI)
  - Note: Le password SMTP dovrebbero essere crittografate usando lo stesso sistema delle chiavi API AI. Twilio è stato rimosso dall'applicazione.

### Performance
- [ ] Ottimizzare le query del database per le collezioni condivise
  - Le query con OR e relazioni multiple potrebbero essere ottimizzate
  - Valutare l'uso di indici aggiuntivi

## Priorità Bassa

### UI/UX
- [x] Aggiungere conferma modale per eliminazione di contenitori e oggetti ⚠️ **PARZIALMENTE IMPLEMENTATO**
  - ✅ Implementato DeleteConfirmModal per le collezioni
  - ⚠️ Da estendere: DeleteConfirmModal per contenitori e oggetti
  - Note: Il componente DeleteConfirmModal esiste ed è riutilizzabile. Deve essere integrato nelle pagine di eliminazione contenitori e oggetti.

### Funzionalità
- [ ] Implementare ricerca/filtro nelle liste di collezioni, contenitori e oggetti
- [ ] Aggiungere ordinamento personalizzabile (per nome, data creazione, etc.)
- [ ] Implementare esportazione dati (CSV, JSON)

### Documentazione
- [x] Creare documentazione utente completa ⚠️ **PARZIALMENTE COMPLETATO**
- [ ] Aggiungere tooltip e help text nelle interfacce
- [x] Creare guida per la configurazione SMTP ✅ **COMPLETATO** (in DOCKER.md e pannello configurazione)
- Note: Documentazione Docker completa. Manca documentazione utente per l'uso dell'applicazione e tooltip nelle interfacce.

## Note

*Questo file può essere aggiornato con nuove idee e miglioramenti*

