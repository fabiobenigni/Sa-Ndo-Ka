import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { photoUrl, provider, objectTypeId } = await request.json();

    // Recupera configurazione AI utente
    const aiConfig = await prisma.aIConfig.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
    });

    if (!aiConfig || !aiConfig.enabled || !aiConfig.apiKey) {
      return NextResponse.json(
        { error: 'AI non configurata o non abilitata' },
        { status: 400 }
      );
    }

    // Recupera tipo oggetto e proprietà
    const objectType = await prisma.objectType.findUnique({
      where: { id: objectTypeId },
      include: {
        properties: {
          include: {
            lookupValues: true,
          },
        },
      },
    });

    if (!objectType) {
      return NextResponse.json(
        { error: 'Tipo oggetto non trovato' },
        { status: 404 }
      );
    }

    let analysis: any = {};

    // Decifra la chiave API
    const apiKey = decrypt(aiConfig.apiKey);

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analizza questa foto e genera una descrizione e le caratteristiche per un oggetto di tipo "${objectType.name}". Proprietà disponibili: ${objectType.properties.map(p => `${p.name} (${p.type})`).join(', ')}. Restituisci JSON con: description (stringa), properties (oggetto con chiavi = id proprietà, valori = valori delle proprietà).`,
                },
                {
                  type: 'image_url',
                  image_url: { url: photoUrl },
                },
              ],
            },
          ],
        });

        const content = response.choices[0].message.content;
        analysis = JSON.parse(content || '{}');
      } else if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey });
        
        // Converti l'URL dell'immagine in base64 se necessario
        let imageData: { type: 'image'; source: { type: 'url'; url: string } } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };
        
        if (photoUrl.startsWith('data:image')) {
          // Già in base64
          const [header, data] = photoUrl.split(',');
          const mediaType = header.match(/data:image\/(\w+);base64/)?.[1] || 'jpeg';
          imageData = {
            type: 'image',
            source: {
              type: 'base64',
              media_type: `image/${mediaType}`,
              data: data,
            },
          };
        } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
          // URL pubblico
          imageData = {
            type: 'image',
            source: {
              type: 'url',
              url: photoUrl,
            },
          };
        } else {
          // URL relativo - converti in URL assoluto
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const absoluteUrl = photoUrl.startsWith('/') ? `${baseUrl}${photoUrl}` : `${baseUrl}/${photoUrl}`;
          imageData = {
            type: 'image',
            source: {
              type: 'url',
              url: absoluteUrl,
            },
          };
        }

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929', // Modello più recente e performante
          max_tokens: 4096, // Aumentato per risposte più complete
          messages: [
            {
              role: 'user',
              content: [
                imageData,
                {
                  type: 'text',
                  text: `Analizza questa foto e genera una descrizione dettagliata e le caratteristiche per un oggetto di tipo "${objectType.name}".

Proprietà disponibili:
${objectType.properties.map(p => `- ${p.name} (${p.type}${p.required ? ', obbligatorio' : ''})`).join('\n')}

${objectType.properties.some(p => p.lookupValues && p.lookupValues.length > 0) ? '\nValori possibili per le proprietà:\n' + objectType.properties.filter(p => p.lookupValues && p.lookupValues.length > 0).map(p => `- ${p.name}: ${p.lookupValues.map((lv: any) => lv.label).join(', ')}`).join('\n') : ''}

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
          // Estrai JSON dalla risposta (potrebbe contenere markdown o testo aggiuntivo)
          const text = content.text;
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Nessun JSON valido trovato nella risposta');
          }
        }
      } else if (provider === 'google') {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Converti l'immagine in base64 se necessario
        let imageData: { inlineData: { data: string; mimeType: string } } | string;
        
        if (photoUrl.startsWith('data:image')) {
          // Già in base64
          const [header, data] = photoUrl.split(',');
          const mimeType = header.match(/data:image\/(\w+);base64/)?.[1] || 'jpeg';
          imageData = {
            inlineData: {
              data: data,
              mimeType: `image/${mimeType}`,
            },
          };
        } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
          // URL pubblico - Gemini può accettare URL direttamente
          imageData = photoUrl;
        } else {
          // URL relativo - converti in URL assoluto
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const absoluteUrl = photoUrl.startsWith('/') ? `${baseUrl}${photoUrl}` : `${baseUrl}/${photoUrl}`;
          imageData = absoluteUrl;
        }

        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash', // Modello più recente e performante
        });
        
        const prompt = `Analizza questa foto e genera una descrizione dettagliata e le caratteristiche per un oggetto di tipo "${objectType.name}".

Proprietà disponibili:
${objectType.properties.map(p => `- ${p.name} (${p.type}${p.required ? ', obbligatorio' : ''})`).join('\n')}

${objectType.properties.some(p => p.lookupValues && p.lookupValues.length > 0) ? '\nValori possibili per le proprietà:\n' + objectType.properties.filter(p => p.lookupValues && p.lookupValues.length > 0).map(p => `- ${p.name}: ${p.lookupValues.map((lv: any) => lv.label).join(', ')}`).join('\n') : ''}

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
          typeof imageData === 'string' 
            ? { fileData: { fileUri: imageData, mimeType: 'image/jpeg' } }
            : imageData,
        ]);

        const content = response.response.text();
        // Estrai JSON dalla risposta (potrebbe contenere markdown o testo aggiuntivo)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Nessun JSON valido trovato nella risposta');
        }
      }

      // Aggiorna contatore free tier se necessario
      if (aiConfig.useFreeTier) {
        await prisma.aIConfig.update({
          where: { id: aiConfig.id },
          data: { freeTierUsed: { increment: 1 } },
        });
      }

      return NextResponse.json(analysis);
    } catch (error: any) {
      console.error('AI analysis error:', error);
      return NextResponse.json(
        { error: 'Errore nell\'analisi AI', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in AI analyze:', error);
    return NextResponse.json(
      { error: 'Errore nel processo di analisi' },
      { status: 500 }
    );
  }
}

