import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const objectTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  properties: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'select', 'boolean', 'date', 'year']),
    required: z.boolean().optional(),
    lookupValues: z.array(z.string()).optional(),
  })).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const objectTypes = await prisma.objectType.findMany({
      where: {
        OR: [
          { userId: null }, // Tipi globali
          { userId: session.user.id }, // Tipi dell'utente
        ],
      },
      include: {
        properties: {
          include: {
            lookupValues: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { objects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(objectTypes);
  } catch (error) {
    console.error('Error fetching object types:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei tipi oggetto' },
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
    const { name, description, properties } = objectTypeSchema.parse(body);

    const objectType = await prisma.objectType.create({
      data: {
        name,
        description,
        userId: session.user.id,
        properties: properties ? {
          create: properties.map((prop, index) => ({
            name: prop.name,
            type: prop.type,
            required: prop.required || false,
            order: index,
            lookupValues: prop.lookupValues ? {
              create: prop.lookupValues.map((value, valIndex) => ({
                value,
                label: value,
                order: valIndex,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        properties: {
          include: {
            lookupValues: true,
          },
        },
      },
    });

    return NextResponse.json(objectType, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating object type:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del tipo oggetto' },
      { status: 500 }
    );
  }
}

