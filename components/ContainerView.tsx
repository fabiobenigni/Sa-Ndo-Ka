'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ObjectForm from '@/components/ObjectForm';
import MoveObjectsModal from '@/components/MoveObjectsModal';
import Link from 'next/link';

interface ContainerViewProps {
  container: any;
}

export default function ContainerView({ container }: ContainerViewProps) {
  const router = useRouter();
  const [objectTypes, setObjectTypes] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [objects, setObjects] = useState(container.items || []);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moving, setMoving] = useState(false);
  const [viewMode, setViewMode] = useState<'tiles' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('containerViewMode');
      return (saved === 'tiles' || saved === 'table') ? saved : 'tiles';
    }
    return 'tiles';
  });

  useEffect(() => {
    fetchObjectTypes();
    fetchObjects();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('containerViewMode', viewMode);
    }
  }, [viewMode]);

  const fetchObjectTypes = async () => {
    try {
      const response = await fetch('/api/object-types');
      const data = await response.json();
      setObjectTypes(data);
    } catch (error) {
      console.error('Error fetching object types:', error);
    }
  };

  const fetchObjects = async () => {
    try {
      const response = await fetch(`/api/objects?containerId=${container.id}`);
      const data = await response.json();
      setObjects(data.map((obj: any) => ({ id: obj.id, object: obj })));
    } catch (error) {
      console.error('Error fetching objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    window.open(`/api/containers/${container.id}/qr`, '_blank');
  };

  const toggleSelection = (objectId: string) => {
    const newSelection = new Set(selectedObjectIds);
    if (newSelection.has(objectId)) {
      newSelection.delete(objectId);
    } else {
      newSelection.add(objectId);
    }
    setSelectedObjectIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedObjectIds.size === objects.length) {
      setSelectedObjectIds(new Set());
    } else {
      setSelectedObjectIds(new Set(objects.map((item: any) => item.object.id)));
    }
  };

  const handleMove = async (targetContainerId: string) => {
    if (selectedObjectIds.size === 0) return;

    setMoving(true);
    try {
      const response = await fetch('/api/objects/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectIds: Array.from(selectedObjectIds),
          sourceContainerId: container.id,
          targetContainerId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectionMode(false);
        setSelectedObjectIds(new Set());
        setShowMoveModal(false);
        await fetchObjects();
      } else {
        alert(data.error || 'Errore nello spostamento degli oggetti');
      }
    } catch (error) {
      console.error('Error moving objects:', error);
      alert('Errore nello spostamento degli oggetti');
    } finally {
      setMoving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Home Page', href: '/' },
    { label: container.collection?.name || 'Collezione', href: `/dashboard/collections/${container.collectionId}` },
    { label: container.name },
  ];

  return (
    <DashboardLayout
      title={container.name}
      breadcrumbs={breadcrumbs}
    >
      {/* Header con azioni */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {container.description && (
            <p className="text-gray-600">{container.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectionMode ? (
            <>
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedObjectIds(new Set());
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
              >
                Annulla
              </button>
              {selectedObjectIds.size > 0 && (
                <>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  >
                    📦 Sposta ({selectedObjectIds.size})
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedObjectIds.size === 0) return;
                      
                      if (!confirm(`Vuoi analizzare ${selectedObjectIds.size} oggetto/i con AI?`)) {
                        return;
                      }

                      try {
                        const response = await fetch('/api/ai/analyze-batch', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            objectIds: Array.from(selectedObjectIds),
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          // Aggiorna gli oggetti con i risultati dell'analisi
                          for (const result of data.results) {
                            try {
                              await fetch(`/api/objects/${result.objectId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  description: result.analysis.description,
                                  properties: result.analysis.properties || {},
                                }),
                              });
                            } catch (error) {
                              console.error(`Error updating object ${result.objectId}:`, error);
                            }
                          }

                          let message = `Analisi completata!\n\nAnalizzati: ${data.analyzed}/${data.total}`;
                          if (data.errors.length > 0) {
                            message += `\nErrori: ${data.errors.length}`;
                            message += '\n\nOggetti con errori:\n' + data.errors.map((e: any) => `- ${e.objectName}: ${e.error}`).join('\n');
                          }
                          alert(message);
                          fetchObjects();
                        } else {
                          alert(data.error || 'Errore nell\'analisi batch');
                        }
                      } catch (error) {
                        console.error('Error in batch analyze:', error);
                        alert('Errore nell\'analisi batch');
                      }
                    }}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                  >
                    🔍 Analizza con AI ({selectedObjectIds.size})
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleDownloadQR}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
              >
                📄 QR PDF
              </button>
              {objects.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                >
                  ✓ Seleziona
                </button>
              )}
              {objectTypes.length === 0 ? (
                <Link
                  href="/dashboard/settings"
                  className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium text-sm"
                >
                  ⚙️ Tipo Oggetto
                </Link>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-3 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium text-sm"
                >
                  + Aggiungi
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form creazione oggetto */}
      {showCreateForm && (
        <div className="mb-6">
          <ObjectForm
            objectTypes={objectTypes}
            containerId={container.id}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchObjects();
            }}
            onCancel={() => setShowCreateForm(false)}
            onObjectTypesUpdate={(updatedTypes) => {
              setObjectTypes(updatedTypes);
            }}
          />
        </div>
      )}

      {/* Lista oggetti */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-primary-800">Oggetti nel contenitore</h2>
          <div className="flex items-center gap-3">
            {selectionMode && objects.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedObjectIds.size === objects.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
              </button>
            )}
            {objects.length > 0 && !selectionMode && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('tiles')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'tiles'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Visualizzazione tiles"
                >
                  ⬜ Tiles
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Visualizzazione tabella"
                >
                  ☰ Tabella
                </button>
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <p className="text-gray-600">Caricamento...</p>
        ) : objects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Nessun oggetto in questo contenitore</p>
            {objectTypes.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Aggiungi il primo oggetto
              </button>
            )}
          </div>
        ) : viewMode === 'tiles' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objects.map((item: any) => {
              const isSelected = selectedObjectIds.has(item.object.id);
              const Component = selectionMode ? 'div' : Link;
              const props = selectionMode
                ? {
                    onClick: () => toggleSelection(item.object.id),
                    className: `border-2 rounded-lg p-4 bg-white/50 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-md'
                        : 'border-primary-200 hover:shadow-lg'
                    }`,
                  }
                : {
                    href: `/dashboard/objects/${item.object.id}`,
                    className: 'border border-primary-200 rounded-lg p-4 bg-white/50 hover:shadow-lg transition-shadow',
                  };

              return (
                <Component key={item.id} {...props}>
                  {selectionMode && (
                    <div className="mb-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item.object.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </div>
                  )}
                {item.object.photoUrl ? (
                  <img
                    src={item.object.photoUrl.startsWith('/api/uploads/') 
                      ? item.object.photoUrl 
                      : item.object.photoUrl.startsWith('/uploads/')
                      ? `/api${item.object.photoUrl}`
                      : `/api/uploads${item.object.photoUrl}`
                    }
                    alt={item.object.name}
                    className="w-full h-48 object-cover rounded mb-2"
                    onError={(e) => {
                      console.error('Errore caricamento immagine:', item.object.photoUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Nessuna immagine</span>
                  </div>
                )}
                <h3 className="font-semibold text-primary-800">{item.object.name}</h3>
                {item.object.description && (
                  <p className="text-sm text-primary-700 mt-1 line-clamp-2">{item.object.description}</p>
                )}
                {item.object.properties && item.object.properties.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.object.properties.slice(0, 3).map((prop: any) => (
                      <div key={prop.id} className="text-xs text-primary-600">
                        <span className="font-medium">{prop.property?.name || 'Proprietà'}:</span>{' '}
                        {prop.value}
                      </div>
                    ))}
                    {item.object.properties.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{item.object.properties.length - 3} altre proprietà
                      </div>
                    )}
                  </div>
                )}
                </Component>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  {selectionMode && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-primary-700 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedObjectIds.size === objects.length && objects.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Immagine</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-primary-700 uppercase">Nome</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-primary-700 uppercase hidden md:table-cell">Tipo</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-primary-700 uppercase hidden lg:table-cell">Descrizione</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-primary-700 uppercase hidden lg:table-cell">Proprietà</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {objects.map((item: any) => {
                  const isSelected = selectedObjectIds.has(item.object.id);
                  const rowClassName = selectionMode
                    ? `cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`
                    : 'hover:bg-gray-50 transition-colors';

                  const handleRowClick = selectionMode
                    ? () => toggleSelection(item.object.id)
                    : (e: React.MouseEvent) => {
                        // Naviga solo se non si è cliccato su un link o checkbox
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'A' && target.tagName !== 'INPUT') {
                          router.push(`/dashboard/objects/${item.object.id}`);
                        }
                      };

                  return (
                    <tr
                      key={item.id}
                      onClick={handleRowClick}
                      className={rowClassName}
                    >
                      {selectionMode && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(item.object.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td className="px-3 py-3">
                        {item.object.photoUrl ? (
                          <img
                            src={item.object.photoUrl.startsWith('/api/uploads/') 
                              ? item.object.photoUrl 
                              : item.object.photoUrl.startsWith('/uploads/')
                              ? `/api${item.object.photoUrl}`
                              : `/api/uploads${item.object.photoUrl}`
                            }
                            alt={item.object.name}
                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">📷</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {selectionMode ? (
                          <>
                            <div className="font-semibold text-primary-800">{item.object.name}</div>
                            <div className="text-xs text-gray-500 md:hidden mt-1">
                              {item.object.objectType?.name}
                            </div>
                          </>
                        ) : (
                          <Link href={`/dashboard/objects/${item.object.id}`} className="block">
                            <div className="font-semibold text-primary-800 hover:text-primary-600">{item.object.name}</div>
                            <div className="text-xs text-gray-500 md:hidden mt-1">
                              {item.object.objectType?.name}
                            </div>
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-sm text-primary-700">{item.object.objectType?.name}</span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        {item.object.description ? (
                          <p className="text-sm text-gray-700 line-clamp-2">{item.object.description}</p>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        {item.object.properties && item.object.properties.length > 0 ? (
                          <div className="text-xs text-primary-600 space-y-1">
                            {item.object.properties.slice(0, 2).map((prop: any) => (
                              <div key={prop.id}>
                                <span className="font-medium">{prop.property?.name}:</span> {prop.value}
                              </div>
                            ))}
                            {item.object.properties.length > 2 && (
                              <div className="text-gray-500">
                                +{item.object.properties.length - 2} altre
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MoveObjectsModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onConfirm={handleMove}
        sourceContainerId={container.id}
        selectedCount={selectedObjectIds.size}
        loading={moving}
      />
    </DashboardLayout>
  );
}

