import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Endpoint di ricerca per oggetti
 * 
 * Logica di partizionamento e condivisioni:
 * 1. Partizionamento per userId: ogni oggetto ha un proprietario (Object.userId)
 * 2. Condivisioni gestite tramite CollectionShare:
 *    - Le condivisioni sono a livello di collezione (non di oggetto)
 *    - Un oggetto è accessibile se:
 *      a) È di proprietà dell'utente (Object.userId = session.user.id)
 *      b) OPPURE appartiene a una collezione condivisa con l'utente
 *         (CollectionShare.userId = session.user.id AND accepted = true)
 * 3. La ricerca cerca in:
 *    - Object.name (nome oggetto)
 *    - Object.description (descrizione oggetto)
 *    - ObjectType.name (tipologia)
 *    - ObjectProperty.value (valori delle caratteristiche)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query troppo corta (minimo 2 caratteri)' }, { status: 400 });
    }

    // Normalizza la query per ricerca case-insensitive
    const searchPattern = `%${query.toLowerCase()}%`;
    const userId = session.user.id;

    // STEP 1: Trova le collezioni accessibili all'utente
    // Questo include sia le collezioni di proprietà che quelle condivise
    const accessibleCollections = await prisma.collection.findMany({
      where: {
        deletedAt: null, // Solo collezioni non eliminate
        OR: [
          // Collezioni di proprietà dell'utente
          { userId },
          // Collezioni condivise con l'utente (accettate)
          {
            shares: {
              some: {
                userId,
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

    // STEP 2: Query Prisma per trovare gli oggetti che matchano
    // SQLite non supporta mode: 'insensitive' nativamente, quindi usiamo contains
    // e filtriamo manualmente per case-insensitive
    
    const allObjects = await prisma.object.findMany({
      where: {
        deletedAt: null, // Solo oggetti non eliminati
        userId, // Partizionamento: solo oggetti di proprietà dell'utente
        // L'oggetto deve essere in almeno un contenitore di una collezione accessibile
        containers: {
          some: {
            container: {
              deletedAt: null, // Contenitore non eliminato
              collection: {
                id: { in: collectionIds }, // Collezione accessibile
                deletedAt: null, // Collezione non eliminata
              },
            },
          },
        },
      },
      include: {
        objectType: {
          select: {
            id: true,
            name: true,
          },
        },
        properties: {
          include: {
            property: {
              select: {
                name: true,
              },
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
                    userId: true, // Proprietario della collezione
                  },
                },
              },
            },
          },
        },
      },
      take: 500, // Prendiamo più risultati per filtrare dopo
    });

    // STEP 3: Filtra e formatta i risultati determinando il campo di match
    const queryLower = query.toLowerCase();
    const searchResults = allObjects
      .filter(obj => {
        // Filtro case-insensitive manuale
        return (
          obj.name.toLowerCase().includes(queryLower) ||
          obj.description?.toLowerCase().includes(queryLower) ||
          obj.objectType.name.toLowerCase().includes(queryLower) ||
          obj.properties.some(p => p.value.toLowerCase().includes(queryLower))
        );
      })
      .slice(0, 100) // Limita a 100 risultati
      .map(obj => {
        // Determina quale campo ha fatto match (priorità: name > objectType > property > description)
        let matchField = 'unknown';
        let matchValue = '';
        let propertyName: string | null = null;

        if (obj.name.toLowerCase().includes(queryLower)) {
          matchField = 'name';
          matchValue = obj.name;
        } else if (obj.objectType.name.toLowerCase().includes(queryLower)) {
          matchField = 'objectType';
          matchValue = obj.objectType.name;
        } else {
          // Cerca nelle caratteristiche
          const matchingProperty = obj.properties.find(p =>
            p.value.toLowerCase().includes(queryLower)
          );
          if (matchingProperty) {
            matchField = 'property';
            matchValue = matchingProperty.value;
            propertyName = matchingProperty.property.name;
          } else if (obj.description?.toLowerCase().includes(queryLower)) {
            matchField = 'description';
            matchValue = obj.description;
          }
        }

        return {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          objectType: {
            id: obj.objectType.id,
            name: obj.objectType.name,
          },
          ownerId: obj.userId, // Proprietario dell'oggetto
          matchField,
          matchValue,
          propertyName,
          containers: obj.containers.map(ci => ({
            id: ci.container.id,
            name: ci.container.name,
            collection: {
              id: ci.container.collection.id,
              name: ci.container.collection.name,
              ownerId: ci.container.collection.userId, // Proprietario della collezione
              isShared: ci.container.collection.userId !== userId, // True se condivisa
            },
          })),
        };
      });

    // I risultati sono già formattati e raggruppati per oggetto
    const results = searchResults;

    return NextResponse.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Errore nella ricerca', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}

