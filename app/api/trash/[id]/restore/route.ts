import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { restoreCollection, restoreContainer, restoreObject } from '@/lib/soft-delete';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const trashItem = await prisma.trashItem.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        restoredAt: null,
      },
    });

    if (!trashItem) {
      return NextResponse.json(
        { error: 'Elemento non trovato o già ripristinato' },
        { status: 404 }
      );
    }

    // Ripristina in base al tipo
    let restoredData;
    switch (trashItem.itemType) {
      case 'collection':
        restoredData = await restoreCollection(params.id);
        break;
      case 'container':
        restoredData = await restoreContainer(params.id);
        break;
      case 'object':
        restoredData = await restoreObject(params.id);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo di elemento non supportato' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: restoredData });
  } catch (error) {
    console.error('Error restoring item:', error);
    return NextResponse.json(
      { error: 'Errore nel ripristino dell\'elemento' },
      { status: 500 }
    );
  }
}

