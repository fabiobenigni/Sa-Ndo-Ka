import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

// Determina se siamo in HTTPS
const isSecure = typeof process !== 'undefined' && process.env.NEXTAUTH_URL?.startsWith('https://');

export const authOptions: NextAuthOptions = {
  // Usa l'URL dalla richiesta quando disponibile (per supportare IP e domini diversi)
  // In NextAuth v4, questo è gestito automaticamente se NEXTAUTH_URL non è impostato
  // Ma dobbiamo comunque configurare i cookie correttamente
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          language: user.language,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  pages: {
    signIn: '/login',
  },
  // Configurazione cookie per funzionare con IP e domini diversi
  useSecureCookies: isSecure,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isSecure,
        // Non impostare domain per permettere cookie su qualsiasi host/IP
        // Questo permette ai cookie di funzionare con localhost, IP e domini
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isSecure,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isSecure,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.language = (user as any).language;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.language = token.language as string;
      }
      return session;
    },
  },
};

