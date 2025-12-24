# Implementazione Motore di Ricerca - Proposta Tecnica

## Panoramica

Il motore di ricerca deve permettere di trovare oggetti cercando in:
- **Nome oggetto** (`Object.name`)
- **Descrizione oggetto** (`Object.description`)
- **Tipologia** (`ObjectType.name`)
- **Caratteristiche** (`ObjectProperty.value`)

I risultati devono includere:
- L'oggetto trovato
- Il contenitore in cui si trova
- La collezione a cui appartiene il contenitore

## Approccio Implementativo

### Opzione 1: Query Prisma con LIKE (Consigliata per iniziare)

**Vantaggi:**
- Implementazione semplice e veloce
- Funziona direttamente con SQLite
- Supporta ricerca parziale e case-insensitive
- Facile da mantenere

**Svantaggi:**
- Performance può degradare con molti dati
- Non supporta fuzzy search nativamente

**Implementazione:**

```typescript
// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query troppo corta' }, { status: 400 });
    }

    // Normalizza la query per ricerca case-insensitive
    const searchPattern = `%${query}%`;

    // Trova gli ID delle collezioni accessibili all'utente
    const accessibleCollections = await prisma.collection.findMany({
      where: {
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                userId: session.user.id,
                accepted: true,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const collectionIds = accessibleCollections.map(c => c.id);

    // Query principale: cerca oggetti che matchano la query
    // Usiamo raw SQL per avere più controllo sulla ricerca LIKE
    const searchResults = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      description: string | null;
      objectTypeName: string;
      containerId: string | null;
      containerName: string | null;
      collectionId: string | null;
      collectionName: string | null;
      matchField: string; // Campo che ha fatto match
      matchValue: string; // Valore che ha fatto match
    }>>`
      SELECT DISTINCT
        o.id,
        o.name,
        o.description,
        ot.name as objectTypeName,
        c.id as containerId,
        c.name as containerName,
        col.id as collectionId,
        col.name as collectionName,
        CASE
          WHEN o.name LIKE ${searchPattern} THEN 'name'
          WHEN o.description LIKE ${searchPattern} THEN 'description'
          WHEN ot.name LIKE ${searchPattern} THEN 'objectType'
          WHEN op.value LIKE ${searchPattern} THEN 'property'
        END as matchField,
        CASE
          WHEN o.name LIKE ${searchPattern} THEN o.name
          WHEN o.description LIKE ${searchPattern} THEN COALESCE(o.description, '')
          WHEN ot.name LIKE ${searchPattern} THEN ot.name
          WHEN op.value LIKE ${searchPattern} THEN op.value
        END as matchValue
      FROM Object o
      INNER JOIN ObjectType ot ON o.objectTypeId = ot.id
      LEFT JOIN ContainerItem ci ON ci.objectId = o.id
      LEFT JOIN Container c ON ci.containerId = c.id AND c.deletedAt IS NULL
      LEFT JOIN Collection col ON c.collectionId = col.id AND col.deletedAt IS NULL
      LEFT JOIN ObjectProperty op ON op.objectId = o.id
      WHERE o.deletedAt IS NULL
        AND o.userId = ${session.user.id}
        AND (col.id IS NULL OR col.id IN (${Prisma.join(collectionIds)}))
        AND (
          o.name LIKE ${searchPattern}
          OR o.description LIKE ${searchPattern}
          OR ot.name LIKE ${searchPattern}
          OR op.value LIKE ${searchPattern}
        )
      ORDER BY 
        CASE 
          WHEN o.name LIKE ${searchPattern} THEN 1
          WHEN ot.name LIKE ${searchPattern} THEN 2
          WHEN op.value LIKE ${searchPattern} THEN 3
          WHEN o.description LIKE ${searchPattern} THEN 4
        END,
        o.name ASC
      LIMIT 100
    `;

    // Raggruppa risultati per oggetto (un oggetto può essere in più contenitori)
    const groupedResults = new Map<string, any>();

    for (const result of searchResults) {
      if (!groupedResults.has(result.id)) {
        groupedResults.set(result.id, {
          id: result.id,
          name: result.name,
          description: result.description,
          objectType: {
            name: result.objectTypeName,
          },
          matchField: result.matchField,
          matchValue: result.matchValue,
          containers: [],
        });
      }

      const obj = groupedResults.get(result.id);
      if (result.containerId && !obj.containers.find((c: any) => c.id === result.containerId)) {
        obj.containers.push({
          id: result.containerId,
          name: result.containerName,
          collection: {
            id: result.collectionId,
            name: result.collectionName,
          },
        });
      }
    }

    return NextResponse.json({
      query,
      results: Array.from(groupedResults.values()),
      total: groupedResults.size,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Errore nella ricerca' },
      { status: 500 }
    );
  }
}
```

**Problema con l'approccio raw SQL:** Prisma non supporta direttamente `Prisma.join()` per array. Meglio usare un approccio ibrido.

### Opzione 1b: Approccio Ibrido (Prisma + Raw SQL semplificato)

```typescript
// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query troppo corta' }, { status: 400 });
    }

    // Normalizza la query per ricerca case-insensitive
    const searchPattern = `%${query.toLowerCase()}%`;

    // Trova gli ID delle collezioni accessibili all'utente
    const accessibleCollections = await prisma.collection.findMany({
      where: {
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                userId: session.user.id,
                accepted: true,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const collectionIds = accessibleCollections.map(c => c.id);

    // Se non ci sono collezioni accessibili, ritorna array vuoto
    if (collectionIds.length === 0) {
      return NextResponse.json({
        query,
        results: [],
        total: 0,
      });
    }

    // Crea placeholders per la query IN
    const placeholders = collectionIds.map(() => '?').join(',');

    // Query raw SQL per la ricerca
    const searchResults = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      description: string | null;
      objectTypeName: string;
      containerId: string | null;
      containerName: string | null;
      collectionId: string | null;
      collectionName: string | null;
      matchField: string;
      matchValue: string;
    }>>`
      SELECT DISTINCT
        o.id,
        o.name,
        o.description,
        ot.name as objectTypeName,
        c.id as containerId,
        c.name as containerName,
        col.id as collectionId,
        col.name as collectionName,
        CASE
          WHEN LOWER(o.name) LIKE ${searchPattern} THEN 'name'
          WHEN LOWER(o.description) LIKE ${searchPattern} THEN 'description'
          WHEN LOWER(ot.name) LIKE ${searchPattern} THEN 'objectType'
          WHEN LOWER(op.value) LIKE ${searchPattern} THEN 'property'
        END as matchField,
        CASE
          WHEN LOWER(o.name) LIKE ${searchPattern} THEN o.name
          WHEN LOWER(o.description) LIKE ${searchPattern} THEN COALESCE(o.description, '')
          WHEN LOWER(ot.name) LIKE ${searchPattern} THEN ot.name
          WHEN LOWER(op.value) LIKE ${searchPattern} THEN op.value
        END as matchValue
      FROM Object o
      INNER JOIN ObjectType ot ON o.objectTypeId = ot.id
      LEFT JOIN ContainerItem ci ON ci.objectId = o.id
      LEFT JOIN Container c ON ci.containerId = c.id AND c.deletedAt IS NULL
      LEFT JOIN Collection col ON c.collectionId = col.id AND col.deletedAt IS NULL
      LEFT JOIN ObjectProperty op ON op.objectId = o.id
      WHERE o.deletedAt IS NULL
        AND o.userId = ${session.user.id}
        AND (col.id IS NULL OR col.id IN (${Prisma.join(collectionIds)}))
        AND (
          LOWER(o.name) LIKE ${searchPattern}
          OR LOWER(o.description) LIKE ${searchPattern}
          OR LOWER(ot.name) LIKE ${searchPattern}
          OR LOWER(op.value) LIKE ${searchPattern}
        )
      ORDER BY 
        CASE 
          WHEN LOWER(o.name) LIKE ${searchPattern} THEN 1
          WHEN LOWER(ot.name) LIKE ${searchPattern} THEN 2
          WHEN LOWER(op.value) LIKE ${searchPattern} THEN 3
          WHEN LOWER(o.description) LIKE ${searchPattern} THEN 4
        END,
        o.name ASC
      LIMIT 100
    `;

    // Raggruppa risultati per oggetto
    const groupedResults = new Map<string, any>();

    for (const result of searchResults) {
      if (!groupedResults.has(result.id)) {
        groupedResults.set(result.id, {
          id: result.id,
          name: result.name,
          description: result.description,
          objectType: {
            name: result.objectTypeName,
          },
          matchField: result.matchField,
          matchValue: result.matchValue,
          containers: [],
        });
      }

      const obj = groupedResults.get(result.id);
      if (result.containerId && !obj.containers.find((c: any) => c.id === result.containerId)) {
        obj.containers.push({
          id: result.containerId,
          name: result.containerName,
          collection: {
            id: result.collectionId,
            name: result.collectionName,
          },
        });
      }
    }

    return NextResponse.json({
      query,
      results: Array.from(groupedResults.values()),
      total: groupedResults.size,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Errore nella ricerca' },
      { status: 500 }
    );
  }
}
```

### Opzione 2: Approccio Prisma Puro (Più semplice ma meno performante)

```typescript
// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query troppo corta' }, { status: 400 });
    }

    // Trova collezioni accessibili
    const accessibleCollections = await prisma.collection.findMany({
      where: {
        deletedAt: null,
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                userId: session.user.id,
                accepted: true,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const collectionIds = accessibleCollections.map(c => c.id);

    // Cerca oggetti che matchano la query
    const objects = await prisma.object.findMany({
      where: {
        deletedAt: null,
        userId: session.user.id,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          {
            objectType: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
          {
            properties: {
              some: {
                value: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
        // Filtra per collezioni accessibili tramite contenitori
        containers: {
          some: {
            container: {
              collectionId: { in: collectionIds },
              deletedAt: null,
            },
          },
        },
      },
      include: {
        objectType: {
          select: { name: true },
        },
        properties: {
          include: {
            property: {
              select: { name: true },
            },
          },
        },
        containers: {
          include: {
            container: {
              include: {
                collection: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    // Formatta i risultati
    const results = objects.map(obj => {
      // Determina quale campo ha fatto match
      let matchField = 'unknown';
      let matchValue = '';

      if (obj.name.toLowerCase().includes(query.toLowerCase())) {
        matchField = 'name';
        matchValue = obj.name;
      } else if (obj.description?.toLowerCase().includes(query.toLowerCase())) {
        matchField = 'description';
        matchValue = obj.description;
      } else if (obj.objectType.name.toLowerCase().includes(query.toLowerCase())) {
        matchField = 'objectType';
        matchValue = obj.objectType.name;
      } else {
        const matchingProperty = obj.properties.find(p =>
          p.value.toLowerCase().includes(query.toLowerCase())
        );
        if (matchingProperty) {
          matchField = 'property';
          matchValue = matchingProperty.value;
        }
      }

      return {
        id: obj.id,
        name: obj.name,
        description: obj.description,
        objectType: {
          name: obj.objectType.name,
        },
        matchField,
        matchValue,
        containers: obj.containers.map(ci => ({
          id: ci.container.id,
          name: ci.container.name,
          collection: {
            id: ci.container.collection.id,
            name: ci.container.collection.name,
          },
        })),
      };
    });

    return NextResponse.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Errore nella ricerca' },
      { status: 500 }
    );
  }
}
```

**Nota:** SQLite con Prisma non supporta `mode: 'insensitive'` nativamente. Dobbiamo usare una funzione helper o raw SQL.

### Opzione 3: SQLite FTS5 (Full-Text Search) - Avanzata

Per una soluzione più performante e avanzata, si può usare SQLite FTS5, ma richiede:
- Creazione di tabelle virtuali FTS5
- Sincronizzazione dei dati
- Query più complesse

**Non consigliata per iniziare**, ma può essere un miglioramento futuro.

## Raccomandazione: Opzione 2 con Helper Function

Implementare l'Opzione 2 ma con una funzione helper per la ricerca case-insensitive:

```typescript
// lib/search-helper.ts
export function createCaseInsensitiveSearch(query: string): {
  namePattern: string;
  descriptionPattern: string;
  objectTypePattern: string;
  propertyPattern: string;
} {
  const pattern = `%${query.toLowerCase()}%`;
  return {
    namePattern: pattern,
    descriptionPattern: pattern,
    objectTypePattern: pattern,
    propertyPattern: pattern,
  };
}
```

E usare raw SQL per la parte LIKE case-insensitive.

## Frontend: Componente di Ricerca

```typescript
// components/SearchBar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Cerca oggetti (es. maglione rosa)..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {loading && <div className="absolute right-4 top-2">Caricamento...</div>}
      
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => router.push(`/dashboard/objects/${result.id}`)}
              className="p-4 hover:bg-gray-100 cursor-pointer border-b"
            >
              <div className="font-semibold">{result.name}</div>
              <div className="text-sm text-gray-600">
                Tipo: {result.objectType.name}
              </div>
              {result.containers.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  In: {result.containers.map((c: any) => 
                    `${c.name} (${c.collection.name})`
                  ).join(', ')}
                </div>
              )}
              <div className="text-xs text-blue-600 mt-1">
                Trovato in: {result.matchField} = "{result.matchValue}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Miglioramenti Futuri

1. **Fuzzy Search**: Implementare con libreria client-side come `fuse.js`
2. **Indicizzazione**: Aggiungere indici full-text se si usa FTS5
3. **Caching**: Cache dei risultati di ricerca frequenti
4. **Paginazione**: Implementare paginazione per risultati numerosi
5. **Filtri avanzati**: Filtrare per tipo oggetto, collezione, etc.

## Note Implementative

- La ricerca deve essere case-insensitive
- Deve supportare ricerca parziale (non solo match esatto)
- Deve rispettare i permessi (solo oggetti accessibili all'utente)
- Deve escludere oggetti eliminati (soft delete)
- Deve includere oggetti anche se non sono in contenitori (LEFT JOIN)

