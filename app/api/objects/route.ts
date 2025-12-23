import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const objectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectTypeId: z.string(),
  containerId: z.string().optional(),
  properties: z.record(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const containerId = searchParams.get('containerId');
    const objectTypeId = searchParams.get('objectTypeId');

    const where: any = {};

    if (containerId) {
      where.containers = {
        some: {
          containerId,
        },
      };
    }

    if (objectTypeId) {
      where.objectTypeId = objectTypeId;
    }

    const objects = await prisma.object.findMany({
      where,
      include: {
        objectType: true,
        properties: {
          include: {
            property: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(objects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero degli oggetti' },
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

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const objectTypeId = formData.get('objectTypeId') as string;
    const containerId = formData.get('containerId') as string | null;
    const propertiesJson = formData.get('properties') as string | null;
    const photo = formData.get('photo') as File | null;

    let photoUrl: string | null = null;

    // Salva foto se presente
    if (photo) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${photo.name}`;
      const filepath = join(process.cwd(), 'uploads', filename);
      await writeFile(filepath, buffer);
      photoUrl = `/uploads/${filename}`;
    }

    const properties = propertiesJson ? JSON.parse(propertiesJson) : {};

    // Crea oggetto
    const object = await prisma.object.create({
      data: {
        name,
        description: description || undefined,
        objectTypeId,
        userId: session.user.id,
        photoUrl,
        properties: {
          create: Object.entries(properties).map(([propertyId, value]) => ({
            propertyId,
            value: String(value),
          })),
        },
      },
      include: {
        objectType: true,
        properties: {
          include: {
            property: true,
          },
        },
      },
    });

    // Aggiungi al contenitore se specificato
    if (containerId) {
      await prisma.containerItem.create({
        data: {
          containerId,
          objectId: object.id,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(object, { status: 201 });
  } catch (error) {
    console.error('Error creating object:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'oggetto' },
      { status: 500 }
    );
  }
}

