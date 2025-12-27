import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const moveObjectsSchema = z.object({
  objectIds: z.array(z.string()).min(1),
  sourceContainerId: z.string(),
  targetContainerId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { objectIds, sourceContainerId, targetContainerId } = moveObjectsSchema.parse(body);

    // Verifica che il contenitore sorgente sia accessibile
    const sourceContainer = await prisma.container.findFirst({
      where: {
        id: sourceContainerId,
        deletedAt: null,
        collection: {
          deletedAt: null,
          OR: [
            { userId: session.user.id },
            {
              shares: {
                some: {
                  userId: session.user.id,
                  accepted: true,
                  permission: 'full', // Serve permesso full per spostare
                },
              },
            },
          ],
        },
      },
    });

    if (!sourceContainer) {
      return NextResponse.json(
        { error: 'Contenitore sorgente non trovato o permessi insufficienti' },
        { status: 403 }
      );
    }

    // Verifica che il contenitore destinazione sia accessibile
    const targetContainer = await prisma.container.findFirst({
      where: {
        id: targetContainerId,
        deletedAt: null,
        collection: {
          deletedAt: null,
          OR: [
            { userId: session.user.id },
            {
              shares: {
                some: {
                  userId: session.user.id,
                  accepted: true,
                  permission: 'full', // Serve permesso full per spostare
                },
              },
            },
          ],
        },
      },
    });

    if (!targetContainer) {
      return NextResponse.json(
        { error: 'Contenitore destinazione non trovato o permessi insufficienti' },
        { status: 403 }
      );
    }

    // Verifica che gli oggetti esistano e siano nel contenitore sorgente
    const containerItems = await prisma.containerItem.findMany({
      where: {
        containerId: sourceContainerId,
        objectId: { in: objectIds },
        object: {
          deletedAt: null,
          userId: session.user.id, // Solo oggetti dell'utente
        },
      },
    });

    if (containerItems.length !== objectIds.length) {
      return NextResponse.json(
        { error: 'Alcuni oggetti non sono stati trovati o non appartengono al contenitore sorgente' },
        { status: 404 }
      );
    }

    // Sposta gli oggetti: elimina dal contenitore sorgente e aggiungi al contenitore destinazione
    await prisma.$transaction(async (tx) => {
      // Elimina dal contenitore sorgente
      await tx.containerItem.deleteMany({
        where: {
          containerId: sourceContainerId,
          objectId: { in: objectIds },
        },
      });

      // Aggiungi al contenitore destinazione (evita duplicati)
      for (const objectId of objectIds) {
        await tx.containerItem.upsert({
          where: {
            containerId_objectId: {
              containerId: targetContainerId,
              objectId,
            },
          },
          update: {
            // Se esiste già, aggiorna solo il userId
            userId: session.user.id,
          },
          create: {
            containerId: targetContainerId,
            objectId,
            userId: session.user.id,
          },
        });
      }
    });

    return NextResponse.json({ success: true, moved: objectIds.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error moving objects:', error);
    return NextResponse.json(
      { error: 'Errore nello spostamento degli oggetti' },
      { status: 500 }
    );
  }
}

