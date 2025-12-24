'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
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

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chiudi i risultati quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Chiudi i risultati quando si preme ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      setError('');
      return;
    }

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
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Errore nella ricerca');
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleResultClick = (objectId: string) => {
    setShowResults(false);
    setQuery('');
    router.push(`/dashboard/objects/${objectId}`);
  };

  const handleViewAllResults = () => {
    if (query.trim().length >= 2) {
      setShowResults(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
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
    <div ref={searchRef} className="relative w-full max-w-md mx-auto md:mx-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder="Cerca oggetti..."
          className="w-full px-4 py-2.5 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs z-50">
          {error}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[70vh] md:max-h-96 overflow-y-auto z-50">
          {results.slice(0, 5).map((result) => (
            <div
              key={result.id}
              onClick={() => handleResultClick(result.id)}
              className="p-3 md:p-4 hover:bg-primary-50 active:bg-primary-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors touch-manipulation"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary-800 text-sm md:text-base truncate">
                    {result.name}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Tipo: {result.objectType.name}
                  </div>
                  {result.containers.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                      In: {result.containers.map(c => 
                        `${c.name} (${c.collection.name})`
                      ).join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-blue-600 mt-1 line-clamp-1">
                    Trovato in: {getMatchLabel(result)} = &quot;{result.matchValue}&quot;
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {results.length > 5 && (
            <div
              onClick={handleViewAllResults}
              className="p-3 text-center text-sm md:text-base text-primary-600 hover:bg-primary-50 active:bg-primary-100 cursor-pointer border-t border-gray-200 font-medium touch-manipulation"
            >
              Vedi tutti i {results.length} risultati →
            </div>
          )}
        </div>
      )}

      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white border border-gray-200 rounded-lg shadow-xl z-50 text-center text-gray-500 text-sm">
          Nessun risultato trovato per &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

