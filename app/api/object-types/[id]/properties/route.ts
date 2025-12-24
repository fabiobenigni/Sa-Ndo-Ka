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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const objectType = await prisma.objectType.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: null },
          { userId: session.user.id },
        ],
      },
      include: {
        properties: true,
      },
    });

    if (!objectType) {
      return NextResponse.json(
        { error: 'Tipo oggetto non trovato' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, required, lookupValues } = propertySchema.parse(body);

    const property = await prisma.property.create({
      data: {
        name,
        type,
        required: required || false,
        objectTypeId: params.id,
        order: objectType.properties.length,
        lookupValues: lookupValues && lookupValues.length > 0 ? {
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

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della proprietà' },
      { status: 500 }
    );
  }
}

