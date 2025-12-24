import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const objectTypeSchema = z.object({
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

    const objectType = await prisma.objectType.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: null }, // Tipo globale
          { userId: session.user.id }, // Tipo dell'utente
        ],
      },
    });

    if (!objectType) {
      return NextResponse.json(
        { error: 'Tipo oggetto non trovato' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = objectTypeSchema.parse(body);

    const updated = await prisma.objectType.update({
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

    console.error('Error updating object type:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del tipo oggetto' },
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

    const objectType = await prisma.objectType.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: null }, // Tipo globale
          { userId: session.user.id }, // Tipo dell'utente
        ],
      },
      include: {
        _count: {
          select: { objects: true },
        },
      },
    });

    if (!objectType) {
      return NextResponse.json(
        { error: 'Tipo oggetto non trovato' },
        { status: 404 }
      );
    }

    // Verifica che non ci siano oggetti associati
    if (objectType._count.objects > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: ci sono oggetti associati a questo tipo' },
        { status: 400 }
      );
    }

    await prisma.objectType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting object type:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del tipo oggetto' },
      { status: 500 }
    );
  }
}

