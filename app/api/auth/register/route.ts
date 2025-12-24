import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validazione con messaggi specifici
    try {
      registerSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => {
          if (err.path[0] === 'email') {
            return 'L\'email non è valida';
          }
          if (err.path[0] === 'password') {
            return 'La password deve essere di almeno 6 caratteri';
          }
          if (err.path[0] === 'name') {
            return 'Il nome è obbligatorio';
          }
          return err.message;
        });
        return NextResponse.json(
          { 
            error: errorMessages[0] || 'Dati non validi',
            details: validationError.errors,
            field: validationError.errors[0]?.path[0] || null
          },
          { status: 400 }
        );
      }
    }

    const { name, email, password } = body;

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Un account con questa email esiste già. Usa un\'altra email o accedi se hai già un account.',
          field: 'email'
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea utente
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { 
        message: 'Utente creato con successo', 
        userId: user.id,
        success: true
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Gestione errori Prisma
    if (error?.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json(
        { 
          error: 'Un account con questa email esiste già. Usa un\'altra email o accedi se hai già un account.',
          field: 'email'
        },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    
    // Messaggio di errore più specifico se disponibile
    const errorMessage = error?.message || 'Errore durante la registrazione. Riprova più tardi.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

