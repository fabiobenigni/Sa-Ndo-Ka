'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ObjectForm from '@/components/ObjectForm';
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

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
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
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadQR}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
          >
            📄 Scarica QR PDF
          </button>
          {objectTypes.length === 0 ? (
            <Link
              href="/dashboard/settings"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium text-sm"
            >
              ⚙️ Crea Tipo Oggetto
            </Link>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium text-sm"
            >
              + Aggiungi Oggetto
            </button>
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
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-primary-800">Oggetti nel contenitore</h2>
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
            {objects.map((item: any) => (
              <Link
                key={item.id}
                href={`/dashboard/objects/${item.object.id}`}
                className="border border-primary-200 rounded-lg p-4 bg-white/50 hover:shadow-lg transition-shadow"
              >
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

