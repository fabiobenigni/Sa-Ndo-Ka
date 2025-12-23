import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import QRCode from 'qrcode';

const containerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  collectionId: z.string(),
});

async function generateQRCode(containerId: string, baseUrl: string): Promise<string> {
  const url = `${baseUrl}/container/${containerId}`;
  return await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
  });
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    const where: any = {
      collection: {
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                userId: session.user.id,
                accepted: true,
              },
            },
          },
        ],
      },
    };

    if (collectionId) {
      where.collectionId = collectionId;
    }

    const containers = await prisma.container.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(containers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei contenitori' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, collectionId } = containerSchema.parse(body);

    // Verifica permessi sulla collezione
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
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
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collezione non trovata o permessi insufficienti' },
        { status: 403 }
      );
    }

    // Genera URL base dinamico
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const container = await prisma.container.create({
      data: {
        name,
        description,
        collectionId,
        userId: session.user.id,
        qrCode: `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });

    // Genera QR code
    const qrCodeDataUrl = await generateQRCode(container.id, origin);

    return NextResponse.json({
      ...container,
      qrCodeDataUrl,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating container:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del contenitore' },
      { status: 500 }
    );
  }
}

