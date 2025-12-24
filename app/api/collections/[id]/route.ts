import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { softDeleteCollection } from '@/lib/soft-delete';
import { z } from 'zod';

const collectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Solo collezioni non eliminate
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
      include: {
        _count: {
          select: { containers: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collezione non trovata' },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero della collezione' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: params.id,
        userId: session.user.id, // Solo il proprietario può modificare
        deletedAt: null, // Solo collezioni non eliminate
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collezione non trovata o non autorizzato' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = collectionSchema.parse(body);

    const updated = await prisma.collection.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della collezione' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: params.id,
        userId: session.user.id, // Solo il proprietario può eliminare
        deletedAt: null, // Non già eliminata
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collezione non trovata o non autorizzato' },
        { status: 404 }
      );
    }

    // Soft delete della collezione (cascade eliminerà anche contenitori, oggetti, ecc.)
    await softDeleteCollection(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della collezione' },
      { status: 500 }
    );
  }
}
