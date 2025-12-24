'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    
    if (!newCollection.name.trim()) {
      setError('Il nome è obbligatorio');
      setCreating(false);
      return;
    }

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollection.name.trim(),
          description: newCollection.description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewCollection({ name: '', description: '' });
        setShowCreateForm(false);
        setError('');
        await fetchCollections();
      } else {
        setError(data.error || 'Errore nella creazione della collezione');
        console.error('Error creating collection:', data);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
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

  return (
    <DashboardLayout title="Dashboard">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Gestisci le tue collezioni e contenitori</p>
        </div>

        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              + Crea Collezione
            </button>
          ) : (
            <form onSubmit={handleCreateCollection} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6 mb-4">
              <h3 className="text-xl font-semibold text-primary-800 mb-4">Nuova Collezione</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  id="name"
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  id="description"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
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
                    setShowCreateForm(false);
                    setNewCollection({ name: '', description: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Annulla
                </button>
              </div>
            </form>
          )}
        </div>

        {collections.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-8 text-center">
            <p className="text-primary-700 text-lg font-medium">Nessuna collezione ancora</p>
            <p className="text-primary-600 mt-2">Crea la tua prima collezione per iniziare</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onUpdate={fetchCollections}
              />
            ))}
          </div>
        )}
    </DashboardLayout>
  );
}

function CollectionCard({ collection, onUpdate }: { collection: any; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: collection.name, description: collection.description || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
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
      console.error('Error updating collection:', error);
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
              setEditData({ name: collection.name, description: collection.description || '' });
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
      <Link href={`/dashboard/collections/${collection.id}`} className="block">
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

