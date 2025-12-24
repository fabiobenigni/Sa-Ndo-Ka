import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { softDeleteContainer } from '@/lib/soft-delete';
import { z } from 'zod';

const containerSchema = z.object({
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

    const container = await prisma.container.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Solo contenitori non eliminati
        collection: {
          deletedAt: null, // Solo collezioni non eliminate
          OR: [
            { userId: session.user.id },
            {
              shares: {
                some: {
                  userId: session.user.id,
                  accepted: true,
                  permission: { in: ['write', 'delete'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!container) {
      return NextResponse.json(
        { error: 'Contenitore non trovato o permessi insufficienti' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = containerSchema.parse(body);

    const updated = await prisma.container.update({
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

    console.error('Error updating container:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del contenitore' },
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

    const container = await prisma.container.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Non già eliminato
        collection: {
          OR: [
            { userId: session.user.id },
            {
              shares: {
                some: {
                  userId: session.user.id,
                  accepted: true,
                  permission: { in: ['write', 'delete'] },
                },
              },
            },
          ],
        },
      },
    });

    if (!container) {
      return NextResponse.json(
        { error: 'Contenitore non trovato o permessi insufficienti' },
        { status: 404 }
      );
    }

    // Soft delete del contenitore (cascade eliminerà anche oggetti)
    await softDeleteContainer(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting container:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del contenitore' },
      { status: 500 }
    );
  }
}

