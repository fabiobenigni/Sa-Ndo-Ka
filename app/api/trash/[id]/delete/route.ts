import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
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

    // Elimina fisicamente l'elemento dal database
    try {
      switch (trashItem.itemType) {
        case 'collection':
          await prisma.collection.deleteMany({
            where: { id: trashItem.itemId },
          });
          break;
        case 'container':
          await prisma.container.deleteMany({
            where: { id: trashItem.itemId },
          });
          break;
        case 'object':
          await prisma.object.deleteMany({
            where: { id: trashItem.itemId },
          });
          break;
        default:
          return NextResponse.json(
            { error: 'Tipo di elemento non supportato' },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error(`Error deleting ${trashItem.itemType} ${trashItem.itemId}:`, error);
      // Continua comunque a eliminare il record del cestino
    }

    // Elimina anche il record del cestino
    await prisma.trashItem.delete({
      where: { id: trashItem.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione definitiva dell\'elemento' },
      { status: 500 }
    );
  }
}

