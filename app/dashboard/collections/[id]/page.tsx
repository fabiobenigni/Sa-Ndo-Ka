'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function CollectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const collectionId = params?.id as string;
  
  const [collection, setCollection] = useState<any>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateContainerForm, setShowCreateContainerForm] = useState(false);
  const [newContainer, setNewContainer] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && collectionId) {
      fetchCollection();
      fetchContainers();
    }
  }, [session, collectionId]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data);
      } else {
        console.error('Error fetching collection:', response.status);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
    }
  };

  const fetchContainers = async () => {
    try {
      const response = await fetch(`/api/containers?collectionId=${collectionId}`);
      const data = await response.json();
      setContainers(data);
    } catch (error) {
      console.error('Error fetching containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    
    if (!newContainer.name.trim()) {
      setError('Il nome è obbligatorio');
      setCreating(false);
      return;
    }

    try {
      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContainer.name.trim(),
          description: newContainer.description.trim() || undefined,
          collectionId: collectionId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewContainer({ name: '', description: '' });
        setShowCreateContainerForm(false);
        setError('');
        await fetchContainers();
      } else {
        setError(data.error || 'Errore nella creazione del contenitore');
        console.error('Error creating container:', data);
      }
    } catch (error) {
      console.error('Error creating container:', error);
      setError('Si è verificato un errore durante la creazione');
    } finally {
      setCreating(false);
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

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Collezione non trovata</h1>
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            Torna alla dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title={collection.name}
      breadcrumbs={[
        { label: 'Home Page', href: '/' },
        { label: collection.name }
      ]}
    >
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{collection.name}</h2>
            {collection.description && (
              <p className="text-gray-600">{collection.description}</p>
            )}
          </div>
          <Link
            href={`/dashboard/collections/${collectionId}/share`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            👥 Condividi
          </Link>
        </div>

        <div className="mb-6">
          {!showCreateContainerForm ? (
            <button
              onClick={() => setShowCreateContainerForm(true)}
              className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              + Crea Contenitore
            </button>
          ) : (
            <form onSubmit={handleCreateContainer} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6 mb-4">
              <h3 className="text-xl font-semibold text-primary-800 mb-4">Nuovo Contenitore</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="container-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  id="container-name"
                  type="text"
                  value={newContainer.name}
                  onChange={(e) => setNewContainer({ ...newContainer, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="container-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  id="container-description"
                  value={newContainer.description}
                  onChange={(e) => setNewContainer({ ...newContainer, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50"
                >
                  {creating ? 'Creazione...' : 'Crea'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateContainerForm(false);
                    setNewContainer({ name: '', description: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Annulla
                </button>
              </div>
            </form>
          )}
        </div>

        {containers.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-8 text-center">
            <p className="text-primary-700 text-lg font-medium">Nessun contenitore ancora</p>
            <p className="text-primary-600 mt-2">Crea il tuo primo contenitore per iniziare</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {containers.map((container) => (
              <ContainerCard
                key={container.id}
                container={container}
                onUpdate={fetchContainers}
              />
            ))}
          </div>
        )}
    </DashboardLayout>
  );
}

function ContainerCard({ container, onUpdate }: { container: any; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: container.name, description: container.description || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/containers/${container.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Error updating container:', error);
      setError('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6"
      >
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
          required
        />
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
        />
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditData({ name: container.name, description: container.description || '' });
              setError('');
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
          >
            Annulla
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6 hover:shadow-xl hover:border-primary-300 transition-all relative group">
      <Link href={`/container/${container.id}`} className="block">
        <h3 className="text-xl font-semibold text-primary-800 mb-2">
          {container.name}
        </h3>
        {container.description && (
          <p className="text-primary-700 text-sm mb-4">{container.description}</p>
        )}
        <div className="text-sm text-primary-600 font-medium">
          {container._count?.items || 0} oggetti
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsEditing(true);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200 transition-opacity"
      >
        ✏️ Modifica
      </button>
    </div>
  );
}

