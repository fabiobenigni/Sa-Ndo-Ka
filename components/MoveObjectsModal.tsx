'use client';

import { useState, useEffect } from 'react';

interface Collection {
  id: string;
  name: string;
  containers: Container[];
}

interface Container {
  id: string;
  name: string;
  collectionId: string;
}

interface MoveObjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetContainerId: string) => void;
  sourceContainerId: string;
  selectedCount: number;
  loading?: boolean;
}

export default function MoveObjectsModal({
  isOpen,
  onClose,
  onConfirm,
  sourceContainerId,
  selectedCount,
  loading = false,
}: MoveObjectsModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const collectionsResponse = await fetch('/api/collections');
      const collectionsData = await collectionsResponse.json();
      
      // Carica i contenitori per ogni collezione
      const collectionsWithContainers = await Promise.all(
        collectionsData.map(async (collection: Collection) => {
          const containersResponse = await fetch(`/api/containers?collectionId=${collection.id}`);
          const containersData = await containersResponse.json();
          return {
            ...collection,
            containers: containersData.filter((c: Container) => c.id !== sourceContainerId),
          };
        })
      );

      setCollections(collectionsWithContainers.filter((c: Collection) => c.containers.length > 0));
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleConfirm = () => {
    if (selectedContainerId) {
      onConfirm(selectedContainerId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-primary-200 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 border-b border-primary-200">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Sposta {selectedCount} {selectedCount === 1 ? 'oggetto' : 'oggetti'}
          </h3>
          <p className="text-sm md:text-base text-gray-600">
            Seleziona il contenitore di destinazione
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loadingCollections ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Caricamento contenitori...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nessun contenitore disponibile</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div key={collection.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-primary-50 px-4 py-2 border-b border-primary-200">
                    <h4 className="font-semibold text-primary-800">{collection.name}</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {collection.containers.map((container) => (
                      <label
                        key={container.id}
                        className={`flex items-center p-3 md:p-4 cursor-pointer hover:bg-primary-50 transition-colors ${
                          selectedContainerId === container.id ? 'bg-primary-100' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="container"
                          value={container.id}
                          checked={selectedContainerId === container.id}
                          onChange={(e) => {
                            setSelectedContainerId(e.target.value);
                            setSelectedCollectionId(collection.id);
                          }}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-sm md:text-base text-gray-700 flex-1">
                          {container.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-primary-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedContainerId || loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Spostamento...' : 'Sposta'}
          </button>
        </div>
      </div>
    </div>
  );
}

