import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { softDeleteObject } from '@/lib/soft-delete';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const object = await prisma.object.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        objectType: {
          include: {
            properties: true,
          },
        },
        properties: {
          include: {
            property: true,
          },
        },
        containers: {
          include: {
            container: true,
          },
        },
      },
    });

    if (!object) {
      return NextResponse.json(
        { error: 'Oggetto non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json(object);
  } catch (error) {
    console.error('Error fetching object:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'oggetto' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const object = await prisma.object.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null, // Solo oggetti non eliminati
      },
    });

    if (!object) {
      return NextResponse.json(
        { error: 'Oggetto non trovato' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const objectTypeId = formData.get('objectTypeId') as string | null;
    const propertiesJson = formData.get('properties') as string | null;
    const photo = formData.get('photo') as File | null;

    let photoUrl: string | undefined = undefined;

    // Salva nuova foto se presente
    if (photo) {
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${photo.name}`;
      const filepath = join(process.cwd(), 'uploads', filename);
      await writeFile(filepath, buffer);
      photoUrl = `/uploads/${filename}`;
    }

    let properties: Record<string, any> = {};
    try {
      if (propertiesJson) {
        properties = JSON.parse(propertiesJson);
        if (typeof properties !== 'object' || Array.isArray(properties)) {
          properties = {};
        }
      }
    } catch (error) {
      console.error('Error parsing properties JSON:', error);
      properties = {};
    }

    // Prepara i dati per l'aggiornamento
    const updateData: any = {
      name,
      description: description || null,
    };

    // Aggiorna proprietà solo se ci sono proprietà da gestire
    const propertyEntries = Object.entries(properties).filter(([_, value]) => value !== null && value !== undefined && value !== '');
    if (propertyEntries.length > 0) {
      updateData.properties = {
        deleteMany: {},
        create: propertyEntries.map(([propertyId, value]) => ({
          propertyId,
          value: String(value),
        })),
      };
    } else {
      // Se non ci sono proprietà, elimina solo quelle esistenti
      updateData.properties = {
        deleteMany: {},
      };
    }

    // Aggiungi objectTypeId solo se fornito
    if (objectTypeId) {
      updateData.objectTypeId = objectTypeId;
    }

    // Aggiungi photoUrl solo se c'è una nuova foto
    if (photoUrl) {
      updateData.photoUrl = photoUrl;
    }

    // Aggiorna oggetto
    const updated = await prisma.object.update({
      where: { id: params.id },
      data: updateData,
      include: {
        objectType: true,
        properties: {
          include: {
            property: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating object:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', {
      objectId: params.id,
      errorMessage,
      errorStack,
      updateData: JSON.stringify(updateData, null, 2),
    });
    return NextResponse.json(
      { 
        error: 'Errore nell\'aggiornamento dell\'oggetto',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const object = await prisma.object.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null, // Non già eliminato
      },
    });

    if (!object) {
      return NextResponse.json(
        { error: 'Oggetto non trovato' },
        { status: 404 }
      );
    }

    // Soft delete dell'oggetto
    await softDeleteObject(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'oggetto' },
      { status: 500 }
    );
  }
}

