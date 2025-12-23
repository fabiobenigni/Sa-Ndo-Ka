import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      language?: string;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    language?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    language?: string;
  }
}

