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

    const share = await prisma.collectionShare.findFirst({
      where: {
        id: params.id,
        collection: {
          userId: session.user.id,
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Condivisione non trovata' },
        { status: 404 }
      );
    }

    await prisma.collectionShare.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting share:', error);
    return NextResponse.json(
      { error: 'Errore nella rimozione della condivisione' },
      { status: 500 }
    );
  }
}

