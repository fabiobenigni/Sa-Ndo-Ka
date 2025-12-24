import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File | null;

    if (!photo) {
      return NextResponse.json(
        { error: 'Nessuna foto fornita' },
        { status: 400 }
      );
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${photo.name}`;
    const filepath = join(process.cwd(), 'uploads', filename);
    await writeFile(filepath, buffer);
    const photoUrl = `/uploads/${filename}`;

    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Errore nel caricamento della foto' },
      { status: 500 }
    );
  }
}

