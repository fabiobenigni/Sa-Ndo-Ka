'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  objectType: {
    id: string;
    name: string;
  };
  ownerId: string;
  matchField: string;
  matchValue: string;
  propertyName: string | null;
  containers: Array<{
    id: string;
    name: string;
    collection: {
      id: string;
      name: string;
      ownerId: string;
      isShared: boolean;
    };
  }>;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore nella ricerca');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Errore nella ricerca');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getMatchLabel = (result: SearchResult): string => {
    switch (result.matchField) {
      case 'name':
        return 'Nome';
      case 'description':
        return 'Descrizione';
      case 'objectType':
        return 'Tipologia';
      case 'property':
        return result.propertyName || 'Caratteristica';
      default:
        return 'Trovato';
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Home Page', href: '/' }, { label: 'Ricerca' }]}>
      <div className="mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
          Risultati di Ricerca
        </h2>

        {query && (
          <p className="text-sm md:text-base text-gray-600">
            Ricerca per: <span className="font-semibold text-primary-700">&quot;{query}&quot;</span>
          </p>
        )}
      </div>

      {query.length < 2 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-8 text-center">
          <p className="text-primary-700 text-lg font-medium">
            Inserisci almeno 2 caratteri per cercare
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-primary-700 mt-4">Ricerca in corso...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && query.length >= 2 && results.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-8 text-center">
          <p className="text-primary-700 text-lg font-medium">
            Nessun risultato trovato per &quot;{query}&quot;
          </p>
          <p className="text-primary-600 mt-2">
            Prova con termini diversi o verifica l&apos;ortografia
          </p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Trovati <span className="font-semibold text-primary-700">{results.length}</span> risultati
          </div>

          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-4 md:p-6 hover:shadow-xl hover:border-primary-300 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                {/* Immagine */}
                {result.photoUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={result.photoUrl.startsWith('/api/uploads/') 
                        ? result.photoUrl 
                        : result.photoUrl.startsWith('/uploads/')
                        ? `/api${result.photoUrl}`
                        : `/api/uploads${result.photoUrl}`
                      }
                      alt={result.name}
                      className="w-full md:w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/objects/${result.id}`}
                    className="block group"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-primary-800 mb-2 group-hover:text-primary-600 transition-colors break-words">
                      {result.name}
                    </h3>
                  </Link>

                  {result.description && (
                    <p className="text-primary-700 text-sm mb-3 break-words">
                      {result.description}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 md:gap-4 text-xs md:text-sm">
                    <div>
                      <span className="text-gray-600">Tipologia:</span>{' '}
                      <span className="font-medium text-primary-700">
                        {result.objectType.name}
                      </span>
                    </div>

                    {result.containers.length > 0 && (
                      <div>
                        <span className="text-gray-600">Posizione:</span>{' '}
                        <span className="font-medium text-primary-700 break-words">
                          {result.containers.map((c, idx) => (
                            <span key={c.id}>
                              {idx > 0 && ', '}
                              <Link
                                href={`/dashboard/collections/${c.collection.id}`}
                                className="hover:text-primary-600 underline break-words"
                              >
                                {c.name}
                              </Link>
                              {' '}
                              <span className="text-gray-500">
                                ({c.collection.name}
                                {c.collection.isShared && (
                                  <span className="text-blue-600 ml-1">• Condivisa</span>
                                )}
                                )
                              </span>
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    <div className="break-words">
                      <span className="text-gray-600">Trovato in:</span>{' '}
                      <span className="font-medium text-blue-600">
                        {getMatchLabel(result)} = &quot;{result.matchValue}&quot;
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/objects/${result.id}`}
                  className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors text-sm font-medium text-center touch-manipulation whitespace-nowrap"
                >
                  Vedi dettagli
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

