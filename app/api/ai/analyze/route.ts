import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey: aiConfig.apiKey });
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
        const anthropic = new Anthropic({ apiKey: aiConfig.apiKey });
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'url',
                    url: photoUrl,
                  },
                },
                {
                  type: 'text',
                  text: `Analizza questa foto e genera una descrizione e le caratteristiche per un oggetto di tipo "${objectType.name}". Proprietà disponibili: ${objectType.properties.map(p => `${p.name} (${p.type})`).join(', ')}. Restituisci JSON con: description (stringa), properties (oggetto con chiavi = id proprietà, valori = valori delle proprietà).`,
                },
              ] as any,
            },
          ],
        });

        const content = response.content[0];
        if (content.type === 'text') {
          analysis = JSON.parse(content.text || '{}');
        }
      } else if (provider === 'google') {
        const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        const response = await model.generateContent([
          `Analizza questa foto e genera una descrizione e le caratteristiche per un oggetto di tipo "${objectType.name}". Proprietà disponibili: ${objectType.properties.map(p => `${p.name} (${p.type})`).join(', ')}. Restituisci JSON con: description (stringa), properties (oggetto con chiavi = id proprietà, valori = valori delle proprietà).`,
          { inlineData: { data: photoUrl, mimeType: 'image/jpeg' } },
        ]);

        const content = response.response.text();
        analysis = JSON.parse(content || '{}');
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

