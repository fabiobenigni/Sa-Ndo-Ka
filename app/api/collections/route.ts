import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const collectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Query per recuperare collezioni non eliminate
    // Includiamo sia le collezioni dell'utente che quelle condivise
    const collections = await prisma.collection.findMany({
      where: {
        AND: [
          { deletedAt: null }, // Solo collezioni non eliminate
          {
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
        ],
      },
      include: {
        containers: {
          where: {
            deletedAt: null, // Solo contenitori non eliminati per il conteggio
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mappiamo i risultati per includere _count basato sui containers inclusi
    const collectionsWithCount = collections.map(c => ({
      ...c,
      _count: {
        containers: c.containers?.length || 0,
      },
    }));

    console.log(`[Collections API] User: ${session.user.id}, Found: ${collectionsWithCount.length} collections`);

    return NextResponse.json(collectionsWithCount);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle collezioni' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica che l'utente esista nel database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.error('User not found in database:', session.user.id);
      return NextResponse.json(
        { error: 'Utente non trovato nel database' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = collectionSchema.parse(body);

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della collezione', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}

