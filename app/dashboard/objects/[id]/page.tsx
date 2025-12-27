'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ErrorModal from '@/components/ErrorModal';
import Link from 'next/link';
import ObjectForm from '@/components/ObjectForm';

export default function ObjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const objectId = params?.id as string;

  const [object, setObject] = useState<any>(null);
  const [objectTypes, setObjectTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && objectId) {
      fetchObject();
      fetchObjectTypes();
    }
  }, [session, objectId]);

  const fetchObjectTypes = async () => {
    try {
      const response = await fetch('/api/object-types');
      const data = await response.json();
      setObjectTypes(data);
    } catch (error) {
      console.error('Error fetching object types:', error);
    }
  };

  const handleObjectTypesUpdate = (updatedTypes: any[]) => {
    setObjectTypes(updatedTypes);
  };

  const fetchObject = async () => {
    try {
      const response = await fetch(`/api/objects/${objectId}`);
      if (!response.ok) {
        throw new Error('Oggetto non trovato');
      }
      const data = await response.json();
      setObject(data);
    } catch (error) {
      console.error('Error fetching object:', error);
      setError('Errore nel caricamento dell\'oggetto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo oggetto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/objects/${objectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting object:', error);
      alert('Errore nell\'eliminazione dell\'oggetto');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Caricamento...">
        <div className="flex items-center justify-center py-12">
          <div className="text-xl">Caricamento...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !object) {
    return (
      <DashboardLayout title="Errore">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Oggetto non trovato'}</p>
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            Torna alla dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Home Page', href: '/' },
    { label: 'Oggetto' },
  ];

  if (isEditing && object) {
    return (
      <DashboardLayout title={`Modifica: ${object.name}`} breadcrumbs={breadcrumbs}>
        <ObjectEditForm
          object={object}
          objectTypes={objectTypes}
          onSuccess={() => {
            setIsEditing(false);
            fetchObject();
            fetchObjectTypes();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={object.name} breadcrumbs={breadcrumbs}>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
        >
          ✏️ Modifica
        </button>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Immagine e info principali */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
          {object.photoUrl ? (
            <img
              src={object.photoUrl.startsWith('/api/uploads/') 
                ? object.photoUrl 
                : object.photoUrl.startsWith('/uploads/')
                ? `/api${object.photoUrl}`
                : `/api/uploads${object.photoUrl}`
              }
              alt={object.name}
              className="w-full rounded-lg mb-4"
              onError={(e) => {
                console.error('Errore caricamento immagine:', object.photoUrl);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Nessuna immagine</span>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-primary-800 mb-2">{object.name}</h3>
            {object.description && (
              <p className="text-gray-700">{object.description}</p>
            )}
          </div>
          <div className="mb-4">
            <span className="text-sm text-gray-600">Tipo:</span>{' '}
            <span className="font-medium text-primary-800">{object.objectType?.name}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {object.photoUrl && (
              <button
                onClick={async () => {
                  if (!confirm('Vuoi analizzare questo oggetto con AI? I dati verranno aggiornati automaticamente.')) {
                    return;
                  }

                  setAnalyzing(true);
                  try {
                    const photoUrl = object.photoUrl.startsWith('/api/uploads/')
                      ? object.photoUrl
                      : object.photoUrl.startsWith('/uploads/')
                      ? `/api${object.photoUrl}`
                      : `/api/uploads${object.photoUrl}`;
                    
                    const response = await fetch(photoUrl);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        const base64Image = reader.result as string;
                        const providers = ['anthropic', 'openai', 'google'];
                        let analysis = null;
                        let lastError: string | null = null;

                        for (const provider of providers) {
                          try {
                            const analyzeResponse = await fetch('/api/ai/analyze', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                photoUrl: base64Image,
                                provider,
                                objectTypeId: object.objectTypeId,
                              }),
                            });

                            if (analyzeResponse.ok) {
                              analysis = await analyzeResponse.json();
                              break;
                            } else {
                              const errorData = await analyzeResponse.json();
                              lastError = errorData.error || `Errore con ${provider}`;
                              console.error(`Errore con ${provider}:`, errorData);
                            }
                          } catch (err) {
                            console.error(`Errore con ${provider}:`, err);
                            lastError = err instanceof Error ? err.message : `Errore di connessione con ${provider}`;
                          }
                        }

                        if (analysis) {
                          // Aggiorna l'oggetto con i risultati usando FormData
                          const formData = new FormData();
                          formData.append('name', analysis.name || object.name);
                          formData.append('description', analysis.description || object.description || '');
                          formData.append('objectTypeId', object.objectTypeId);
                          formData.append('properties', JSON.stringify(analysis.properties || {}));

                          const updateResponse = await fetch(`/api/objects/${object.id}`, {
                            method: 'PUT',
                            body: formData,
                          });

                          if (updateResponse.ok) {
                            alert('Analisi completata! I dati sono stati aggiornati.');
                            window.location.reload();
                          } else {
                            const errorData = await updateResponse.json();
                            setErrorModal({
                              isOpen: true,
                              title: 'Errore Aggiornamento',
                              message: `Errore nell'aggiornamento dell'oggetto:\n\n${errorData.error || 'Errore sconosciuto'}`,
                            });
                          }
                        } else {
                          setErrorModal({
                            isOpen: true,
                            title: 'Errore Analisi AI',
                            message: lastError || 'Nessun provider AI disponibile o configurato correttamente.\n\nVerifica la configurazione nelle Impostazioni → Configurazione AI.',
                          });
                        }
                      } catch (error) {
                        console.error('Error in analysis:', error);
                        setErrorModal({
                          isOpen: true,
                          title: 'Errore Analisi AI',
                          message: error instanceof Error ? error.message : 'Errore nell\'analisi della foto',
                        });
                      } finally {
                        setAnalyzing(false);
                      }
                    };
                    reader.onerror = () => {
                      setErrorModal({
                        isOpen: true,
                        title: 'Errore',
                        message: 'Errore nella lettura della foto',
                      });
                      setAnalyzing(false);
                    };
                    reader.readAsDataURL(blob);
                  } catch (error) {
                    console.error('Error loading photo:', error);
                    setErrorModal({
                      isOpen: true,
                      title: 'Errore',
                      message: error instanceof Error ? error.message : 'Errore nel caricamento della foto',
                    });
                    setAnalyzing(false);
                  }
                }}
                disabled={analyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {analyzing ? 'Analizzando...' : '🔍 Analizza con AI'}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Elimina
            </button>
            <Link
              href={`/container/${object.containers?.[0]?.containerId || ''}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Torna al contenitore
            </Link>
          </div>
        </div>

        {/* Proprietà */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
          <h3 className="text-xl font-semibold text-primary-800 mb-4">Proprietà</h3>
          {object.properties && object.properties.length > 0 ? (
            <div className="space-y-3">
              {object.properties.map((prop: any) => (
                <div key={prop.id} className="border-b border-gray-200 pb-3">
                  <div className="font-medium text-primary-800">{prop.property?.name}</div>
                  <div className="text-gray-700 mt-1">
                    {prop.property?.type === 'boolean' ? (
                      prop.value === 'true' ? 'Sì' : 'No'
                    ) : (
                      prop.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Nessuna proprietà definita</p>
          )}
        </div>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => {
          setErrorModal({ isOpen: false, title: '', message: '' });
          if (!analyzing) {
            fetchObject(); // Ricarica l'oggetto dopo la chiusura del modale
          }
        }}
        title={errorModal.title}
        message={errorModal.message}
      />
    </DashboardLayout>
  );
}

function ObjectEditForm({ object, objectTypes, onSuccess, onCancel }: { object: any; objectTypes: any[]; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: object.name,
    description: object.description || '',
    objectTypeId: object.objectTypeId,
    photo: null as File | null,
    properties: object.properties.reduce((acc: any, prop: any) => {
      acc[prop.propertyId] = prop.value;
      return acc;
    }, {} as Record<string, any>),
  });
  const [selectedType, setSelectedType] = useState<any>(object.objectType);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    object.photoUrl 
      ? (object.photoUrl.startsWith('/api/uploads/') 
          ? object.photoUrl 
          : object.photoUrl.startsWith('/uploads/')
          ? `/api${object.photoUrl}`
          : object.photoUrl.startsWith('data:')
          ? object.photoUrl
          : `/api/uploads${object.photoUrl}`)
      : null
  );
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: '', description: '' });
  const [newTypeProperties, setNewTypeProperties] = useState<Array<{
    name: string;
    type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'year';
    required: boolean;
    lookupValues: string[];
  }>>([]);
  const [creatingType, setCreatingType] = useState(false);
  const [currentObjectTypes, setCurrentObjectTypes] = useState(objectTypes);
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'select' | 'boolean' | 'date' | 'year',
    required: false,
    lookupValues: '',
  });

  useEffect(() => {
    setCurrentObjectTypes(objectTypes);
  }, [objectTypes]);

  useEffect(() => {
    if (formData.objectTypeId && formData.objectTypeId !== 'new-type') {
      const type = currentObjectTypes.find((t) => t.id === formData.objectTypeId);
      setSelectedType(type);
    } else if (formData.objectTypeId === 'new-type') {
      setShowNewTypeModal(true);
      setFormData({ ...formData, objectTypeId: object.objectTypeId });
    }
  }, [formData.objectTypeId, currentObjectTypes]);

  const handleAddProperty = () => {
    if (!newProperty.name.trim()) {
      setError('Il nome della proprietà è obbligatorio');
      return;
    }

    if (newProperty.type === 'select' && !newProperty.lookupValues.trim()) {
      setError('Inserisci almeno un valore per il tipo selezione');
      return;
    }

    const property = {
      name: newProperty.name.trim(),
      type: newProperty.type,
      required: newProperty.required,
      lookupValues: newProperty.type === 'select' 
        ? newProperty.lookupValues.split('\n').filter(Boolean).map(v => v.trim())
        : [],
    };

    setNewTypeProperties([...newTypeProperties, property]);
    setNewProperty({ name: '', type: 'text', required: false, lookupValues: '' });
    setShowAddPropertyForm(false);
    setError('');
  };

  const handleRemoveProperty = (index: number) => {
    setNewTypeProperties(newTypeProperties.filter((_, i) => i !== index));
  };

  const handleCreateNewType = async () => {
    if (!newTypeData.name.trim()) {
      setError('Il nome del tipo è obbligatorio');
      return;
    }

    setCreatingType(true);
    setError('');

    try {
      const response = await fetch('/api/object-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeData.name.trim(),
          description: newTypeData.description.trim() || undefined,
          properties: newTypeProperties.length > 0 ? newTypeProperties : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedTypes = [...currentObjectTypes, data];
        setCurrentObjectTypes(updatedTypes);
        setFormData({ ...formData, objectTypeId: data.id });
        setShowNewTypeModal(false);
        setNewTypeData({ name: '', description: '' });
        setNewTypeProperties([]);
      } else {
        setError(data.error || 'Errore nella creazione del tipo');
      }
    } catch (error) {
      console.error('Error creating type:', error);
      setError('Si è verificato un errore durante la creazione del tipo');
    } finally {
      setCreatingType(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeAI = async () => {
    const photoToAnalyze = formData.photo || (object.photoUrl ? null : null);
    
    if (!photoToAnalyze && !object.photoUrl) {
      setError('Carica una foto per analizzare');
      return;
    }

    if (!formData.objectTypeId) {
      setError('Seleziona un tipo di oggetto per analizzare');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      let base64Image: string;
      
      if (formData.photo) {
        // Usa la nuova foto caricata
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            base64Image = reader.result as string;
            await performAnalysis(base64Image);
          } catch (error) {
            console.error('Error analyzing photo:', error);
            setError('Errore nell\'analisi della foto');
            setAnalyzing(false);
          }
        };
        reader.onerror = () => {
          setError('Errore nella lettura della foto');
          setAnalyzing(false);
        };
        reader.readAsDataURL(formData.photo);
      } else if (object.photoUrl) {
        // Usa la foto esistente dell'oggetto
        const photoUrl = object.photoUrl.startsWith('/api/uploads/')
          ? object.photoUrl
          : object.photoUrl.startsWith('/uploads/')
          ? `/api${object.photoUrl}`
          : `/api/uploads${object.photoUrl}`;
        
        // Converti URL in base64
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            base64Image = reader.result as string;
            await performAnalysis(base64Image);
          } catch (error) {
            console.error('Error analyzing photo:', error);
            setError('Errore nell\'analisi della foto');
            setAnalyzing(false);
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
      setError('Errore nell\'analisi della foto');
      setAnalyzing(false);
    }

    async function performAnalysis(base64Image: string) {
      const providers = ['anthropic', 'openai', 'google'];
      let analysis = null;

      for (const provider of providers) {
        try {
          console.log(`Tentativo analisi con provider: ${provider}`);
          const analyzeResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoUrl: base64Image,
              provider,
              objectTypeId: formData.objectTypeId,
            }),
          });

          if (analyzeResponse.ok) {
            analysis = await analyzeResponse.json();
            console.log(`Analisi completata con successo usando ${provider}:`, analysis);
            break;
          } else {
            const errorData = await analyzeResponse.json();
            console.error(`Errore con ${provider}:`, errorData);
            if (provider === providers[providers.length - 1]) {
              setError(errorData.error || `Errore con ${provider}: ${errorData.details || 'Errore sconosciuto'}`);
            }
          }
        } catch (err) {
          console.error(`Errore con ${provider}:`, err);
          if (provider === providers[providers.length - 1]) {
            setError(`Errore di connessione con ${provider}. Verifica la configurazione nelle impostazioni.`);
          }
        }
      }

      if (analysis) {
        setFormData({
          ...formData,
          name: analysis.name || formData.name,
          description: analysis.description || formData.description,
          properties: { ...formData.properties, ...analysis.properties },
        });
      } else {
        setError('Nessun provider AI disponibile o configurato correttamente');
      }
      setAnalyzing(false);
    }
  };

  const handlePropertyChange = (propertyId: string, value: any) => {
    setFormData({
      ...formData,
      properties: {
        ...formData.properties,
        [propertyId]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.name.trim()) {
      setError('Il nome è obbligatorio');
      setSaving(false);
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name.trim());
      submitFormData.append('description', formData.description.trim() || '');
      submitFormData.append('objectTypeId', formData.objectTypeId);
      submitFormData.append('properties', JSON.stringify(formData.properties));
      if (formData.photo) {
        submitFormData.append('photo', formData.photo);
      }

      const response = await fetch(`/api/objects/${object.id}`, {
        method: 'PUT',
        body: submitFormData,
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Errore nell\'aggiornamento dell\'oggetto');
      }
    } catch (error) {
      console.error('Error updating object:', error);
      setError('Si è verificato un errore durante l\'aggiornamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
      <h3 className="text-xl font-semibold text-primary-800 mb-4">Modifica Oggetto</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Oggetto *</label>
        <select
          value={formData.objectTypeId}
          onChange={(e) => setFormData({ ...formData, objectTypeId: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        >
          {objectTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white min-w-0"
          />
          {(formData.photo || object.photoUrl) && (
            <button
              type="button"
              onClick={handleAnalyzeAI}
              disabled={analyzing || !formData.objectTypeId}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              {analyzing ? 'Analizzando...' : '🔍 Analizza con AI'}
            </button>
          )}
        </div>
        {photoPreview && (
          <img src={photoPreview} alt="Preview" className="mt-2 max-w-xs rounded-lg" />
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        />
      </div>

      {selectedType?.properties && selectedType.properties.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Proprietà</label>
          <div className="space-y-3">
            {selectedType.properties.map((prop: any) => (
              <div key={prop.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {prop.name}
                  {prop.required && <span className="text-red-500"> *</span>}
                </label>
                {prop.type === 'text' && (
                  <input
                    type="text"
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                )}
                {prop.type === 'number' && (
                  <input
                    type="number"
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                )}
                {prop.type === 'select' && (
                  <select
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  >
                    <option value="">Seleziona...</option>
                    {prop.lookupValues?.map((lv: any) => (
                      <option key={lv.id} value={lv.value}>
                        {lv.label}
                      </option>
                    ))}
                  </select>
                )}
                {prop.type === 'boolean' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.properties[prop.id] === 'true' || formData.properties[prop.id] === true}
                      onChange={(e) => handlePropertyChange(prop.id, e.target.checked ? 'true' : 'false')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Sì</span>
                  </label>
                )}
                {prop.type === 'date' && (
                  <input
                    type="date"
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                )}
                {prop.type === 'year' && (
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    step="1"
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    placeholder="Es: 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          Annulla
        </button>
      </div>

      {/* Modale per creare nuovo tipo */}
      {showNewTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-primary-800 mb-4">Crea Nuovo Tipo di Oggetto</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="new-type-name-edit" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Tipo *
              </label>
              <input
                id="new-type-name-edit"
                type="text"
                value={newTypeData.name}
                onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Es: Maglietta, Libro, etc."
              />
            </div>

            <div className="mb-4">
              <label htmlFor="new-type-description-edit" className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                id="new-type-description-edit"
                value={newTypeData.description}
                onChange={(e) => setNewTypeData({ ...newTypeData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descrizione opzionale del tipo di oggetto"
              />
            </div>

            {/* Proprietà */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Proprietà
                </label>
                {!showAddPropertyForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddPropertyForm(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Aggiungi Proprietà
                  </button>
                )}
              </div>

              {/* Lista proprietà aggiunte */}
              {newTypeProperties.length > 0 && (
                <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                  {newTypeProperties.map((prop, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex-1">
                        <span className="font-medium text-sm text-gray-800">{prop.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({prop.type})</span>
                        {prop.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-2">Obbligatorio</span>
                        )}
                        {prop.type === 'select' && prop.lookupValues.length > 0 && (
                          <span className="text-xs text-gray-600 ml-2">
                            Valori: {prop.lookupValues.join(', ')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(index)}
                        className="text-red-600 hover:text-red-700 text-sm ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form aggiunta proprietà */}
              {showAddPropertyForm && (
                <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome Proprietà *</label>
                    <input
                      type="text"
                      value={newProperty.name}
                      onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Es: Colore, Taglia, etc."
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                    <select
                      value={newProperty.type}
                      onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as any })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Valori (uno per riga) *</label>
                      <textarea
                        value={newProperty.lookupValues}
                        onChange={(e) => setNewProperty({ ...newProperty, lookupValues: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Es: Rosso&#10;Blu&#10;Verde"
                      />
                    </div>
                  )}
                  <div className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={newProperty.required}
                      onChange={(e) => setNewProperty({ ...newProperty, required: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-xs text-gray-700">Obbligatorio</label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleAddProperty}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Aggiungi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPropertyForm(false);
                        setNewProperty({ name: '', type: 'text', required: false, lookupValues: '' });
                      }}
                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCreateNewType}
                disabled={creatingType || !newTypeData.name.trim()}
                className="flex-1 px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50"
              >
                {creatingType ? 'Creazione...' : 'Crea'}
              </button>
              <button
                onClick={() => {
                  setShowNewTypeModal(false);
                  setNewTypeData({ name: '', description: '' });
                  setNewTypeProperties([]);
                  setShowAddPropertyForm(false);
                  setNewProperty({ name: '', type: 'text', required: false, lookupValues: '' });
                  setError('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

