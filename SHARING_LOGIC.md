# Logica di Gestione Condivisioni e Partizionamento Database

## Architettura del Partizionamento

### Principio Fondamentale: Proprietario (Owner)

Ogni entità nel database ha un campo `userId` che identifica il **proprietario** (owner) dell'entità:

- **Collection**: `userId` = utente che ha creato la collezione
- **Container**: `userId` = utente che ha creato il contenitore
- **Object**: `userId` = utente che ha creato l'oggetto
- **ObjectType**: `userId` = utente che ha creato il tipo (null = tipo globale)

### Partizionamento Logico

Il database è **partizionato logicamente** per `userId`:
- Ogni utente vede solo le proprie entità di default
- Le condivisioni permettono di accedere ad entità di altri utenti
- Il filtro per `userId` garantisce isolamento dei dati

## Sistema di Condivisioni

### Modello CollectionShare

Le condivisioni sono gestite tramite la tabella `CollectionShare`:

```prisma
model CollectionShare {
  id           String   @id
  collectionId String   // Collezione condivisa
  userId       String?  // Utente con cui è condivisa (null se non registrato)
  permission   String   // "read" o "full"
  invitedBy    String   // Email o telefono dell'invitato
  inviteMethod String?  // "email" o "whatsapp"
  accepted     Boolean  // Se l'utente ha accettato
}
```

### Logica di Accesso

Un utente può accedere a una collezione se:

1. **È il proprietario**: `Collection.userId = session.user.id`
2. **Ha una condivisione accettata**: 
   ```typescript
   CollectionShare.userId = session.user.id 
   AND CollectionShare.accepted = true
   ```

### Permessi

- **"read"**: Solo lettura (può vedere collezione, contenitori, oggetti)
- **"full"**: Accesso completo (può anche creare/modificare/eliminare)

### Catena di Proprietà e Accesso

```
Collection (userId: ownerId)
  └─ Container (userId: ownerId) 
      └─ ContainerItem
          └─ Object (userId: ownerId)
```

**Regola importante**: 
- Gli oggetti mantengono sempre il loro proprietario originale (`Object.userId`)
- Anche se una collezione è condivisa, gli oggetti rimangono di proprietà del creatore
- L'accesso agli oggetti è determinato dall'accesso alla collezione che li contiene

## Implementazione nella Ricerca

### Query di Ricerca

La ricerca implementata in `/api/search` segue questa logica:

```typescript
// 1. Trova collezioni accessibili
const accessibleCollections = await prisma.collection.findMany({
  where: {
    deletedAt: null,
    OR: [
      { userId: session.user.id }, // Proprietario
      {
        shares: {
          some: {
            userId: session.user.id,
            accepted: true, // Condivisione accettata
          },
        },
      },
    ],
  },
});

// 2. Cerca oggetti che:
//    - Sono di proprietà dell'utente (partizionamento)
//    - E appartengono a collezioni accessibili
const objects = await prisma.object.findMany({
  where: {
    userId: session.user.id, // Partizionamento: solo oggetti dell'utente
    containers: {
      some: {
        container: {
          collectionId: { in: accessibleCollectionIds },
        },
      },
    },
  },
});
```

### Perché questa Logica?

1. **Partizionamento per userId**: 
   - Ogni utente vede solo i propri oggetti
   - Garantisce isolamento dei dati
   - Facilita backup/restore per utente

2. **Condivisioni a livello collezione**:
   - Più semplice da gestire rispetto a condivisioni per singolo oggetto
   - Coerente con il modello gerarchico (Collezione > Contenitore > Oggetto)
   - Permette condivisione di intere collezioni con un solo invito

3. **Proprietario invariato**:
   - Gli oggetti mantengono sempre il loro proprietario originale
   - Anche se condivisi, rimangono di proprietà del creatore
   - Utile per audit e tracciabilità

## Esempio Pratico

### Scenario

- **Utente A** (id: "userA") crea:
  - Collezione "Vestiti" (userId: "userA")
  - Contenitore "Armadio" (userId: "userA")
  - Oggetto "Maglione rosa" (userId: "userA")

- **Utente A** condivide la collezione "Vestiti" con **Utente B** (id: "userB")
  - Crea `CollectionShare`: 
    - collectionId: "vestiti-id"
    - userId: "userB"
    - permission: "read"
    - accepted: true

### Cosa vede Utente B?

Quando **Utente B** cerca "maglione rosa":

1. ✅ La collezione "Vestiti" è accessibile (condivisa)
2. ✅ Il contenitore "Armadio" è visibile (appartiene a collezione condivisa)
3. ✅ L'oggetto "Maglione rosa" è trovato nella ricerca perché:
   - Appartiene a una collezione accessibile
   - La ricerca filtra per collezioni accessibili

**Nota importante**: L'oggetto mantiene `userId: "userA"`, ma Utente B può vederlo perché la collezione è condivisa.

### Cosa NON vede Utente B?

- ❌ Oggetti creati da Utente B che non sono in collezioni condivise
- ❌ Collezioni di Utente A non condivise
- ❌ Oggetti eliminati (soft delete)

## Vantaggi di questo Approccio

1. **Sicurezza**: Isolamento dei dati per proprietario
2. **Scalabilità**: Facile partizionare il database per utente
3. **Flessibilità**: Condivisioni granulari con permessi
4. **Tracciabilità**: Sempre chiaro chi è il proprietario
5. **Performance**: Query efficienti con indici su `userId`

## Considerazioni Future

### Miglioramenti Possibili

1. **Condivisioni a livello contenitore**: 
   - Attualmente solo a livello collezione
   - Potrebbe essere utile condividere singoli contenitori

2. **Condivisioni a livello oggetto**:
   - Per casi d'uso specifici
   - Richiederebbe modifiche al modello

3. **Condivisioni di gruppo**:
   - Condividere con gruppi di utenti invece che singoli
   - Richiederebbe tabella `Group` e `GroupShare`

4. **Permessi più granulari**:
   - Permessi per singole operazioni (read, create, update, delete)
   - Attualmente solo "read" e "full"

