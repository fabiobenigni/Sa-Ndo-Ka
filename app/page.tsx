'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function HomePage() {
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
      if (!response.ok) {
        console.error('[Dashboard] API error:', response.status, response.statusText);
        setCollections([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      console.log('[Dashboard] Collections received:', Array.isArray(data) ? data.length : 'not an array', data);
      const collectionsArray = Array.isArray(data) ? data : [];
      setCollections(collectionsArray);
      console.log('[Dashboard] Collections set:', collectionsArray.length);
    } catch (error) {
      console.error('[Dashboard] Error fetching collections:', error);
      setCollections([]);
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
    <DashboardLayout>
        <div className="mb-6 md:mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-4 md:p-6 mb-6">
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
              Benvenuto in Sa-Ndo-Ka! Inizia organizzando i tuoi oggetti creando delle <strong className="text-primary-700">collezioni</strong>.
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
              Per creare una collezione, clicca sul pulsante <strong className="text-primary-700">&quot;+ Crea Collezione&quot;</strong> qui sopra. 
              Dovrai inserire un nome (obbligatorio) e, se vuoi, una descrizione.
            </p>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              Una volta creata la collezione, potrai aprirla e aggiungere dei <strong className="text-primary-700">contenitori</strong> al suo interno. 
              Ogni contenitore può contenere oggetti che potrai catalogare con foto, descrizioni e caratteristiche personalizzate.
            </p>
          </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
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

        {!Array.isArray(collections) || collections.length === 0 ? (
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || 'Errore nell\'eliminazione');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      setError('Errore nell\'eliminazione della collezione');
      setDeleting(false);
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900 bg-white"
          required
        />
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-gray-900 bg-white"
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
    <>
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleting(false);
        }}
        onConfirm={handleDelete}
        title="Elimina Collezione"
        message="La collezione verrà spostata nel cestino e potrà essere ripristinata entro 30 giorni. Dopo questo periodo verrà eliminata definitivamente."
        itemName={collection.name}
        itemType="collection"
        loading={deleting}
      />
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6 hover:shadow-xl hover:border-primary-300 transition-all relative group">
        {error && !isEditing && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
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
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
            }}
            className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs hover:bg-primary-200"
            title="Modifica collezione"
          >
            ✏️ Modifica
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDeleteModal(true);
            }}
            disabled={deleting}
            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
            title="Elimina collezione"
          >
            🗑️ Elimina
          </button>
        </div>
      </div>
    </>
  );
}

