import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const filePath = join(process.cwd(), 'uploads', ...resolvedParams.path);
    
    // Verifica che il file esista e sia nella cartella uploads
    if (!existsSync(filePath) || !filePath.startsWith(join(process.cwd(), 'uploads'))) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const filename = resolvedParams.path[resolvedParams.path.length - 1];
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Determina il content type
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };

    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Errore nel caricamento del file' }, { status: 500 });
  }
}

