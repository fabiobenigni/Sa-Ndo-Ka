import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

const batchAnalyzeSchema = z.object({
  objectIds: z.array(z.string().min(1)),
  provider: z.enum(['openai', 'anthropic', 'google']).optional(),
});

export const dynamic = 'force-dynamic';

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.NEXTAUTH_SECRET || 'default-key-32-chars-long!!', 'utf8').slice(0, 32);
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) return encryptedText; // Non cifrato
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText; // Fallback se non cifrato
  }
}

async function analyzeObjectPhoto(photoUrl: string, objectType: any, provider: string, apiKey: string): Promise<any> {
  // Converti l'URL dell'immagine in base64 se necessario
  let imageBase64: string;
  
  if (photoUrl.startsWith('data:image')) {
    imageBase64 = photoUrl;
  } else {
    // Leggi il file dall'uploads directory
    const filePath = photoUrl.startsWith('/api/uploads/')
      ? join(process.cwd(), 'uploads', photoUrl.replace('/api/uploads/', ''))
      : photoUrl.startsWith('/uploads/')
      ? join(process.cwd(), 'uploads', photoUrl.replace('/uploads/', ''))
      : join(process.cwd(), 'uploads', photoUrl.replace('/api/uploads', ''));
    
    try {
      const fileBuffer = await readFile(filePath);
      const mimeType = 'image/jpeg'; // Assumiamo JPEG per semplicità
      imageBase64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
      throw new Error('Impossibile leggere il file immagine');
    }
  }

  if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey });
    const [header, data] = imageBase64.split(',');
    const mediaType = header.match(/data:image\/(\w+);base64/)?.[1] || 'jpeg';
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${mediaType}`,
                data: data,
              },
            },
            {
              type: 'text',
              text: `Analizza questa foto e genera una descrizione dettagliata e le caratteristiche per un oggetto di tipo "${objectType.name}".

Proprietà disponibili:
${objectType.properties.map((p: any) => `- ${p.name} (${p.type}${p.required ? ', obbligatorio' : ''})`).join('\n')}

${objectType.properties.some((p: any) => p.lookupValues && p.lookupValues.length > 0) ? '\nValori possibili per le proprietà:\n' + objectType.properties.filter((p: any) => p.lookupValues && p.lookupValues.length > 0).map((p: any) => `- ${p.name}: ${p.lookupValues.map((lv: any) => lv.label).join(', ')}`).join('\n') : ''}

IMPORTANTE: Restituisci SOLO un JSON valido con questa struttura esatta:
{
  "description": "descrizione dettagliata dell'oggetto",
  "properties": {
    "${objectType.properties[0]?.id || 'propertyId'}": "valore della proprietà"
  }
}

La descrizione deve essere chiara e dettagliata. Le proprietà devono corrispondere agli ID delle proprietà disponibili. Per le proprietà di tipo "select", usa uno dei valori possibili indicati sopra.`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const text = content.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error('Nessun JSON valido trovato nella risposta');
  } else if (provider === 'google') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const [header, data] = imageBase64.split(',');
    const mimeType = header.match(/data:image\/(\w+);base64/)?.[1] || 'jpeg';
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Analizza questa foto e genera una descrizione dettagliata e le caratteristiche per un oggetto di tipo "${objectType.name}".

Proprietà disponibili:
${objectType.properties.map((p: any) => `- ${p.name} (${p.type}${p.required ? ', obbligatorio' : ''})`).join('\n')}

${objectType.properties.some((p: any) => p.lookupValues && p.lookupValues.length > 0) ? '\nValori possibili per le proprietà:\n' + objectType.properties.filter((p: any) => p.lookupValues && p.lookupValues.length > 0).map((p: any) => `- ${p.name}: ${p.lookupValues.map((lv: any) => lv.label).join(', ')}`).join('\n') : ''}

IMPORTANTE: Restituisci SOLO un JSON valido con questa struttura esatta:
{
  "description": "descrizione dettagliata dell'oggetto",
  "properties": {
    "${objectType.properties[0]?.id || 'propertyId'}": "valore della proprietà"
  }
}

La descrizione deve essere chiara e dettagliata. Le proprietà devono corrispondere agli ID delle proprietà disponibili. Per le proprietà di tipo "select", usa uno dei valori possibili indicati sopra.`;

    const response = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: data,
          mimeType: `image/${mimeType}`,
        },
      },
    ]);

    const content = response.response.text();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Nessun JSON valido trovato nella risposta');
  } else {
    throw new Error(`Provider ${provider} non supportato per batch analyze`);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { objectIds, provider } = batchAnalyzeSchema.parse(body);

    // Recupera gli oggetti con le loro foto e tipi
    const objects = await prisma.object.findMany({
      where: {
        id: { in: objectIds },
        deletedAt: null,
        containers: {
          some: {
            container: {
              collection: {
                OR: [
                  { userId: session.user.id },
                  {
                    shares: {
                      some: {
                        userId: session.user.id,
                        accepted: true,
                        permission: 'full',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      include: {
        objectType: {
          include: {
            properties: {
              include: {
                lookupValues: true,
              },
            },
          },
        },
        containers: {
          include: {
            container: true,
          },
        },
      },
    });

    if (objects.length === 0) {
      return NextResponse.json(
        { error: 'Nessun oggetto trovato o senza permessi' },
        { status: 404 }
      );
    }

    // Trova un provider AI configurato
    const providers = provider ? [provider] : ['anthropic', 'openai', 'google'];
    let aiConfig: any = null;
    let selectedProvider: string | null = null;

    for (const prov of providers) {
      const config = await prisma.aIConfig.findUnique({
        where: {
          userId_provider: {
            userId: session.user.id,
            provider: prov,
          },
        },
      });

      if (config && config.enabled && config.apiKey) {
        aiConfig = config;
        selectedProvider = prov;
        break;
      }
    }

    if (!aiConfig || !selectedProvider) {
      return NextResponse.json(
        { error: 'Nessun provider AI configurato o abilitato. Vai su Impostazioni → Configurazione AI.' },
        { status: 400 }
      );
    }

    // Analizza ogni oggetto che ha una foto
    const results = [];
    const errors = [];

    for (const obj of objects) {
      if (!obj.photoUrl) {
        errors.push({
          objectId: obj.id,
          objectName: obj.name,
          error: 'Oggetto senza foto',
        });
        continue;
      }

      try {
        const apiKey = decrypt(aiConfig.apiKey);
        const analysis = await analyzeObjectPhoto(
          obj.photoUrl.startsWith('/api/uploads/')
            ? obj.photoUrl
            : obj.photoUrl.startsWith('/uploads/')
            ? `/api${obj.photoUrl}`
            : `/api/uploads${obj.photoUrl}`,
          obj.objectType,
          selectedProvider,
          apiKey
        );
        
        results.push({
          objectId: obj.id,
          objectName: obj.name,
          analysis,
        });
      } catch (error) {
        console.error(`Error analyzing object ${obj.id}:`, error);
        errors.push({
          objectId: obj.id,
          objectName: obj.name,
          error: error instanceof Error ? error.message : 'Errore sconosciuto',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      total: objects.length,
      analyzed: results.length,
      failed: errors.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in batch analyze:', error);
    return NextResponse.json(
      { error: 'Errore nell\'analisi batch' },
      { status: 500 }
    );
  }
}

