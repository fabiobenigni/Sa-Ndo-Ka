'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCollections();
    }
  }, [session]);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/app-icon.jpg" alt="Sa-Ndo-Ka" className="h-12 w-12 rounded-lg" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-red text-transparent bg-clip-text">Sa-Ndo-Ka</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-primary-700 font-medium">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="px-4 py-2 text-primary-700 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Esci
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Gestisci le tue collezioni e contenitori</p>
        </div>

        <div className="mb-6">
          <Link
            href="/dashboard/collections/new"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium shadow-lg hover:shadow-xl transition-all"
          >
            + Crea Collezione
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-8 text-center">
            <p className="text-primary-700 text-lg font-medium">Nessuna collezione ancora</p>
            <p className="text-primary-600 mt-2">Crea la tua prima collezione per iniziare</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/dashboard/collections/${collection.id}`}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6 hover:shadow-xl hover:border-primary-300 transition-all"
              >
                <h3 className="text-xl font-semibold text-primary-800 mb-2">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-primary-700 text-sm mb-4">{collection.description}</p>
                )}
                <div className="text-sm text-primary-600 font-medium">
                  {collection._count?.containers || 0} contenitori
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

