'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LogoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error during logout:', error);
      setLoggingOut(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50">
      {/* Immagine di sfondo */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/logout.jpg" 
          alt="Sa-Ndo-Ka" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-primary-100/80 to-accent-yellow-50/80"></div>
      </div>

      {/* Contenuto principale */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          {/* Immagine principale */}
          <div className="hidden md:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/logout.jpg" 
                alt="Sa-Ndo-Ka" 
                className="w-full h-auto rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>

          {/* Form di conferma */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-primary-200 p-8">
            <div className="text-center mb-6">
              {/* Immagine mobile */}
              <div className="md:hidden mb-6">
                <img 
                  src="/logout.jpg" 
                  alt="Sa-Ndo-Ka" 
                  className="w-full max-w-xs mx-auto rounded-xl shadow-lg"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-red text-transparent bg-clip-text mb-2">
                Sa-Ndo-Ka
              </h1>
              <p className="text-primary-700 text-lg font-medium">Conferma logout</p>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-lg">
                <p className="font-medium mb-2 text-lg">Sei sicuro di voler uscire?</p>
                {session?.user?.email && (
                  <p className="text-sm text-yellow-700">
                    Sei connesso come: <strong className="text-primary-700">{session.user.email}</strong>
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-red-600 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  {loggingOut ? 'Uscita in corso...' : 'Esci'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loggingOut}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 transition-all text-lg"
                >
                  Annulla
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  ← Torna alla dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

