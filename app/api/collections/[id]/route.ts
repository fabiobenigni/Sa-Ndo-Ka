import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const collectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

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

