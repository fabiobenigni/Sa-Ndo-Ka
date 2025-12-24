'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [objectTypes, setObjectTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'types' | 'ai'>('types');
  const [showCreateTypeForm, setShowCreateTypeForm] = useState(false);
  const [newType, setNewType] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<any>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchObjectTypes();
    }
  }, [session]);

  const fetchObjectTypes = async () => {
    try {
      const response = await fetch('/api/object-types');
      const data = await response.json();
      setObjectTypes(data);
    } catch (error) {
      console.error('Error fetching object types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    if (!newType.name.trim()) {
      setError('Il nome è obbligatorio');
      setCreating(false);
      return;
    }

    try {
      const response = await fetch('/api/object-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newType.name.trim(),
          description: newType.description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewType({ name: '', description: '' });
        setShowCreateTypeForm(false);
        setError('');
        await fetchObjectTypes();
      } else {
        setError(data.error || 'Errore nella creazione del tipo');
      }
    } catch (error) {
      console.error('Error creating type:', error);
      setError('Si è verificato un errore durante la creazione');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo tipo? Tutti gli oggetti di questo tipo verranno eliminati.')) {
      return;
    }

    try {
      const response = await fetch(`/api/object-types/${typeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchObjectTypes();
        if (selectedType?.id === typeId) {
          setSelectedType(null);
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting type:', error);
      alert('Errore nell\'eliminazione del tipo');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Impostazioni">
        <div className="flex items-center justify-center py-12">
          <div className="text-xl">Caricamento...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout 
      title="Impostazioni"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Impostazioni' }
      ]}
    >
      {/* Tabs */}
      <div className="mb-6 border-b border-primary-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'types'
                ? 'text-primary-700 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Tipi di Oggetti
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'ai'
                ? 'text-primary-700 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Configurazione AI
          </button>
        </div>
      </div>

      {activeTab === 'types' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista tipi */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-primary-800">Tipi di Oggetti</h3>
              <button
                onClick={() => setShowCreateTypeForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                + Nuovo Tipo
              </button>
            </div>

            {showCreateTypeForm && (
              <form onSubmit={handleCreateType} className="mb-6 p-4 bg-primary-50 rounded-lg">
                <h4 className="font-semibold text-primary-800 mb-3">Nuovo Tipo</h4>
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newType.name}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={newType.description}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
                  >
                    {creating ? 'Creazione...' : 'Crea'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTypeForm(false);
                      setNewType({ name: '', description: '' });
                      setError('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {objectTypes.length === 0 ? (
                <p className="text-gray-600 text-sm">Nessun tipo di oggetto ancora</p>
              ) : (
                objectTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedType?.id === type.id
                        ? 'bg-primary-100 border-primary-300'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingTypeId === type.id ? (
                          <TypeEditForm
                            type={type}
                            onSave={async (name, description) => {
                              try {
                                const response = await fetch(`/api/object-types/${type.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name, description }),
                                });
                                if (response.ok) {
                                  setEditingTypeId(null);
                                  await fetchObjectTypes();
                                } else {
                                  const data = await response.json();
                                  alert(data.error || 'Errore nella modifica');
                                }
                              } catch (error) {
                                console.error('Error updating type:', error);
                                alert('Errore nella modifica del tipo');
                              }
                            }}
                            onCancel={() => setEditingTypeId(null)}
                          />
                        ) : (
                          <>
                            <h4 className="font-semibold text-primary-800">{type.name}</h4>
                            {type.description && (
                              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {type.properties?.length || 0} proprietà • {type._count?.objects || 0} oggetti
                            </p>
                          </>
                        )}
                      </div>
                      {editingTypeId !== type.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTypeId(type.id);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            ✏️ Modifica
                          </button>
                          {type._count?.objects === 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteType(type.id);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Elimina
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dettagli tipo e proprietà */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
            {selectedType ? (
              <TypePropertiesEditor type={selectedType} onUpdate={fetchObjectTypes} />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p>Seleziona un tipo per gestire le sue proprietà</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
          <h3 className="text-xl font-semibold text-primary-800 mb-4">Configurazione AI</h3>
          <p className="text-gray-600 mb-4">
            Configura le API key per l&apos;analisi automatica delle foto degli oggetti.
          </p>
          <AIConfigPanel />
        </div>
      )}
    </DashboardLayout>
  );
}

// Componenti helper per modifica
function TypeEditForm({ type, onSave, onCancel }: { type: any; onSave: (name: string, description: string) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(type.name);
  const [description, setDescription] = useState(type.description || '');

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
      />
      <div className="flex space-x-2">
        <button
          onClick={() => onSave(name, description)}
          className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
        >
          Salva
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}

function PropertyEditForm({ property, typeId, onSave, onCancel }: { property: any; typeId: string; onSave: (name: string, type: string, required: boolean, lookupValues: string[]) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(property.name);
  const [type, setType] = useState(property.type);
  const [required, setRequired] = useState(property.required);
  const [lookupValues, setLookupValues] = useState(property.lookupValues?.map((lv: any) => lv.value).join('\n') || '');

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
        required
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
      >
        <option value="text">Testo</option>
        <option value="number">Numero</option>
        <option value="select">Selezione</option>
        <option value="boolean">Sì/No</option>
        <option value="date">Data</option>
        <option value="year">Anno</option>
      </select>
      {type === 'select' && (
        <textarea
          value={lookupValues}
          onChange={(e) => setLookupValues(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
          placeholder="Uno per riga"
        />
      )}
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          className="mr-2"
        />
        <span className="text-sm">Obbligatorio</span>
      </label>
      <div className="flex space-x-2">
        <button
          onClick={() => onSave(name, type, required, lookupValues.split('\n').filter(Boolean))}
          className="px-3 py-1 bg-primary-600 text-white rounded text-sm"
        >
          Salva
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}

// Componente per gestire proprietà di un tipo
function TypePropertiesEditor({ type, onUpdate }: { type: any; onUpdate: () => void }) {
  const [properties, setProperties] = useState(type.properties || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'select' | 'boolean' | 'date' | 'year',
    required: false,
    lookupValues: [] as string[],
  });
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(type);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedType(type);
    setProperties(type.properties || []);
  }, [type]);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newProperty.name.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }

    setAdding(true);
    try {
      // Recupera le proprietà esistenti e aggiungi la nuova
      const response = await fetch(`/api/object-types/${type.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProperty.name.trim(),
          type: newProperty.type,
          required: newProperty.required,
          lookupValues: newProperty.type === 'select' ? newProperty.lookupValues : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewProperty({ name: '', type: 'text', required: false, lookupValues: [] });
        setShowAddForm(false);
        await onUpdate();
      } else {
        setError(data.error || 'Errore nella creazione della proprietà');
      }
    } catch (error) {
      console.error('Error adding property:', error);
      setError('Errore nella creazione della proprietà');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Eliminare questa proprietà?')) return;

    try {
      const response = await fetch(`/api/object-types/${type.id}/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await onUpdate();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Errore nell\'eliminazione della proprietà');
    }
  };

  return (
    <div>
      <h4 className="font-semibold text-primary-800 mb-4">{type.name} - Proprietà</h4>

      {showAddForm && (
        <form onSubmit={handleAddProperty} className="mb-4 p-4 bg-primary-50 rounded-lg">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={newProperty.name}
              onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={newProperty.type}
              onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="text">Testo</option>
              <option value="number">Numero</option>
              <option value="select">Selezione</option>
              <option value="boolean">Sì/No</option>
              <option value="date">Data</option>
              <option value="year">Anno</option>
            </select>
          </div>
          {newProperty.type === 'select' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valori (uno per riga)
              </label>
              <textarea
                value={newProperty.lookupValues.join('\n')}
                onChange={(e) =>
                  setNewProperty({
                    ...newProperty,
                    lookupValues: e.target.value.split('\n').filter(Boolean),
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Es: Rosso&#10;Blu&#10;Verde"
              />
            </div>
          )}
          <div className="mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProperty.required}
                onChange={(e) => setNewProperty({ ...newProperty, required: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Obbligatorio</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
            >
              {adding ? 'Aggiunta...' : 'Aggiungi'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewProperty({ name: '', type: 'text', required: false, lookupValues: [] });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          + Aggiungi Proprietà
        </button>
      )}

      <div className="space-y-2">
        {properties.length === 0 ? (
          <p className="text-gray-600 text-sm">Nessuna proprietà ancora</p>
        ) : (
          properties.map((prop: any) => (
            <div key={prop.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {editingPropertyId === prop.id ? (
                <PropertyEditForm
                  property={prop}
                  typeId={type.id}
                  onSave={async (name, propType, required, lookupValues) => {
                    try {
                      const response = await fetch(`/api/object-types/${type.id}/properties/${prop.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, type: propType, required, lookupValues }),
                      });
                      if (response.ok) {
                        setEditingPropertyId(null);
                        await onUpdate();
                      } else {
                        const data = await response.json();
                        alert(data.error || 'Errore nella modifica');
                      }
                    } catch (error) {
                      console.error('Error updating property:', error);
                      alert('Errore nella modifica della proprietà');
                    }
                  }}
                  onCancel={() => setEditingPropertyId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary-800">{prop.name}</span>
                      <span className="text-xs text-gray-500">({prop.type})</span>
                      {prop.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Obbligatorio
                        </span>
                      )}
                    </div>
                    {prop.type === 'select' && prop.lookupValues?.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Valori: {prop.lookupValues.map((lv: any) => lv.value).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingPropertyId(prop.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(prop.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Componente per configurazione AI
function AIConfigPanel() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/ai/config');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching AI configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (provider: string, apiKey: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, enabled }),
      });

      if (response.ok) {
        await fetchConfigs();
      }
    } catch (error) {
      console.error('Error updating AI config:', error);
    }
  };

  const providers = [
    { id: 'openai', name: 'OpenAI (ChatGPT)', placeholder: 'sk-...' },
    { id: 'anthropic', name: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
    { id: 'google', name: 'Google (Gemini)', placeholder: 'AIza...' },
  ];

  return (
    <div className="space-y-6">
      {providers.map((provider) => {
        const config = configs.find((c: any) => c.provider === provider.id);
        return (
          <div key={provider.id} className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-primary-800 mb-3">{provider.name}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  defaultValue={config?.apiKey || ''}
                  placeholder={provider.placeholder}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleUpdateConfig(provider.id, e.target.value, config?.enabled || false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config?.enabled || false}
                  onChange={(e) =>
                    handleUpdateConfig(provider.id, config?.apiKey || '', e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Abilita analisi AI</span>
              </label>
              {config && (
                <p className="text-xs text-gray-500">
                  Utilizzato: {config.freeTierUsed || 0} / {config.freeTierLimit || 100}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

