import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const propertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'select', 'boolean', 'date', 'year']),
  required: z.boolean().optional(),
  lookupValues: z.array(z.string()).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string; propertyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: params.propertyId,
        objectType: {
          OR: [
            { userId: null },
            { userId: session.user.id },
          ],
        },
      },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Proprietà non trovata' },
        { status: 404 }
      );
    }

    // Verifica che non ci siano valori associati
    if (property._count.values > 0) {
      return NextResponse.json(
        { error: 'Impossibile modificare: ci sono oggetti con questa proprietà' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, type, required, lookupValues } = propertySchema.parse(body);

    // Aggiorna proprietà
    const updated = await prisma.property.update({
      where: { id: params.propertyId },
      data: {
        name,
        type,
        required: required || false,
        // Aggiorna lookup values se presente
        lookupValues: lookupValues ? {
          deleteMany: {},
          create: lookupValues.map((value, index) => ({
            value,
            label: value,
            order: index,
          })),
        } : undefined,
      },
      include: {
        lookupValues: true,
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

    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della proprietà' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; propertyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: params.propertyId,
        objectType: {
          OR: [
            { userId: null },
            { userId: session.user.id },
          ],
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Proprietà non trovata' },
        { status: 404 }
      );
    }

    await prisma.property.delete({
      where: { id: params.propertyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della proprietà' },
      { status: 500 }
    );
  }
}

