import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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

