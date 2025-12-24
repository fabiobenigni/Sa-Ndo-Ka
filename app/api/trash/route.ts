import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const trashItems = await prisma.trashItem.findMany({
      where: {
        userId: session.user.id,
        restoredAt: null, // Solo elementi non ripristinati
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    // Formatta i dati per il frontend
    const formattedItems = trashItems.map((item) => {
      const itemData = JSON.parse(item.itemData);
      return {
        id: item.id,
        itemType: item.itemType,
        itemId: item.itemId,
        name: itemData.name || itemData.id,
        deletedAt: item.deletedAt,
        daysUntilPermanent: Math.max(0, 30 - Math.floor((Date.now() - item.deletedAt.getTime()) / (1000 * 60 * 60 * 24))),
      };
    });

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching trash items:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero del cestino' },
      { status: 500 }
    );
  }
}

