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

  useEffect(() => {
    fetchObjectTypes();
    fetchObjects();
  }, []);

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
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  📦 Sposta ({selectedObjectIds.size})
                </button>
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
          {selectionMode && objects.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {selectedObjectIds.size === objects.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </button>
          )}
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
        ) : (
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

