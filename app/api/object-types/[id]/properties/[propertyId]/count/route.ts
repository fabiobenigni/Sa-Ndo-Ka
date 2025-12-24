import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string; propertyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const count = await prisma.objectProperty.count({
      where: {
        propertyId: params.propertyId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting property values:', error);
    return NextResponse.json(
      { error: 'Errore nel conteggio' },
      { status: 500 }
    );
  }
}

