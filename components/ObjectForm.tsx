'use client';

import { useState, useEffect } from 'react';

interface ObjectFormProps {
  objectTypes: any[];
  containerId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onObjectTypesUpdate?: (types: any[]) => void;
}

export default function ObjectForm({ objectTypes, containerId, onSuccess, onCancel, onObjectTypesUpdate }: ObjectFormProps) {
  const [selectedType, setSelectedType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectTypeId: '',
    photo: null as File | null,
    properties: {} as Record<string, any>,
  });
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
    if (currentObjectTypes.length > 0 && !formData.objectTypeId) {
      setFormData({ ...formData, objectTypeId: currentObjectTypes[0].id });
    }
  }, [currentObjectTypes]);

  useEffect(() => {
    if (formData.objectTypeId && formData.objectTypeId !== 'new-type') {
      const type = currentObjectTypes.find((t) => t.id === formData.objectTypeId);
      setSelectedType(type);
      // Reset proprietà quando cambia tipo
      setFormData({ ...formData, properties: {} });
    } else if (formData.objectTypeId === 'new-type') {
      setShowNewTypeModal(true);
      setFormData({ ...formData, objectTypeId: '' });
    }
  }, [formData.objectTypeId]);

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
        // Aggiorna la lista dei tipi
        const updatedTypes = [...currentObjectTypes, data];
        setCurrentObjectTypes(updatedTypes);
        if (onObjectTypesUpdate) {
          onObjectTypesUpdate(updatedTypes);
        }
        
        // Seleziona il nuovo tipo creato
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
    if (!formData.photo || !formData.objectTypeId) {
      setError('Carica una foto e seleziona un tipo per analizzare');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // Prima carica la foto
      const uploadFormData = new FormData();
      uploadFormData.append('photo', formData.photo);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Errore nel caricamento della foto');
      }

      const { photoUrl } = await uploadResponse.json();

      // Poi analizza con AI (prova tutti i provider disponibili)
      const providers = ['openai', 'anthropic', 'google'];
      let analysis = null;

      for (const provider of providers) {
        try {
          const analyzeResponse = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoUrl,
              provider,
              objectTypeId: formData.objectTypeId,
            }),
          });

          if (analyzeResponse.ok) {
            analysis = await analyzeResponse.json();
            break;
          }
        } catch (err) {
          console.error(`Error with ${provider}:`, err);
        }
      }

      if (analysis) {
        // Aggiorna form con risultati AI
        setFormData({
          ...formData,
          name: analysis.name || formData.name,
          description: analysis.description || formData.description,
          properties: { ...formData.properties, ...analysis.properties },
        });
      } else {
        setError('Nessun provider AI disponibile o configurato');
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
      setError('Errore nell\'analisi della foto');
    } finally {
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
    setCreating(true);

    if (!formData.name.trim()) {
      setError('Il nome è obbligatorio');
      setCreating(false);
      return;
    }

    if (!formData.objectTypeId) {
      setError('Seleziona un tipo di oggetto');
      setCreating(false);
      return;
    }

    // Valida proprietà obbligatorie
    if (selectedType?.properties) {
      const requiredProps = selectedType.properties.filter((p: any) => p.required);
      for (const prop of requiredProps) {
        if (!formData.properties[prop.id]) {
          setError(`La proprietà "${prop.name}" è obbligatoria`);
          setCreating(false);
          return;
        }
      }
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name.trim());
      submitFormData.append('description', formData.description.trim() || '');
      submitFormData.append('objectTypeId', formData.objectTypeId);
      submitFormData.append('containerId', containerId);
      submitFormData.append('properties', JSON.stringify(formData.properties));
      if (formData.photo) {
        submitFormData.append('photo', formData.photo);
      }

      const response = await fetch('/api/objects', {
        method: 'POST',
        body: submitFormData,
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Errore nella creazione dell\'oggetto');
      }
    } catch (error) {
      console.error('Error creating object:', error);
      setError('Si è verificato un errore durante la creazione');
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
      <h3 className="text-xl font-semibold text-primary-800 mb-4">Nuovo Oggetto</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tipo Oggetto */}
      <div className="mb-4">
        <label htmlFor="object-type" className="block text-sm font-medium text-gray-700 mb-2">
          Tipo Oggetto *
        </label>
        <select
          id="object-type"
          value={formData.objectTypeId}
          onChange={(e) => setFormData({ ...formData, objectTypeId: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {currentObjectTypes.length === 0 ? (
            <option value="">Nessun tipo disponibile</option>
          ) : (
            currentObjectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))
          )}
          <option value="new-type" className="font-semibold text-primary-600">
            + Nuovo Tipo
          </option>
        </select>
      </div>

      {/* Foto */}
      <div className="mb-4">
        <label htmlFor="object-photo" className="block text-sm font-medium text-gray-700 mb-2">
          Foto (opzionale)
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <input
            id="object-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white min-w-0"
          />
          {formData.photo && (
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
          <div className="mt-2">
            <img 
              src={photoPreview} 
              alt="Preview" 
              className="max-w-xs rounded-lg border border-gray-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Nome */}
      <div className="mb-4">
        <label htmlFor="object-name" className="block text-sm font-medium text-gray-700 mb-2">
          Nome *
        </label>
        <input
          id="object-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Descrizione */}
      <div className="mb-4">
        <label htmlFor="object-description" className="block text-sm font-medium text-gray-700 mb-2">
          Descrizione
        </label>
        <textarea
          id="object-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Proprietà dinamiche */}
      {selectedType?.properties && selectedType.properties.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proprietà
          </label>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                )}
                {prop.type === 'number' && (
                  <input
                    type="number"
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  />
                )}
                {prop.type === 'select' && (
                  <select
                    value={formData.properties[prop.id] || ''}
                    onChange={(e) => handlePropertyChange(prop.id, e.target.value)}
                    required={prop.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
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
          disabled={creating || currentObjectTypes.length === 0}
          className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50"
        >
          {creating ? 'Creazione...' : 'Crea'}
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
              <label htmlFor="new-type-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Tipo *
              </label>
              <input
                id="new-type-name"
                type="text"
                value={newTypeData.name}
                onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Es: Maglietta, Libro, etc."
              />
            </div>

            <div className="mb-4">
              <label htmlFor="new-type-description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                id="new-type-description"
                value={newTypeData.description}
                onChange={(e) => setNewTypeData({ ...newTypeData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
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
                  // Ripristina il primo tipo disponibile
                  if (currentObjectTypes.length > 0) {
                    setFormData({ ...formData, objectTypeId: currentObjectTypes[0].id });
                  }
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

