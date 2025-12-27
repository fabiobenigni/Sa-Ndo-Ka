'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ShareCollectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const collectionId = params?.id as string;

  const [collection, setCollection] = useState<any>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    phone: '',
    method: 'email' as 'email' | 'whatsapp',
    permission: 'read' as 'read' | 'full',
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && collectionId) {
      fetchCollection();
      fetchShares();
    }
  }, [session, collectionId]);

  const fetchCollection = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      const found = data.find((c: any) => c.id === collectionId);
      setCollection(found);
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/share?collectionId=${collectionId}`);
      const data = await response.json();
      // Assicurati che data sia sempre un array
      setShares(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shares:', error);
      setShares([]); // In caso di errore, imposta array vuoto
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);

    if (inviteData.method === 'email' && !inviteData.email) {
      setError('Email richiesta per invito via email');
      setInviting(false);
      return;
    }

    if (inviteData.method === 'whatsapp' && !inviteData.phone) {
      setError('Numero di telefono richiesto per invito via WhatsApp');
      setInviting(false);
      return;
    }

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId,
          email: inviteData.email || undefined,
          phone: inviteData.phone || undefined,
          method: inviteData.method,
          permission: inviteData.permission,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.whatsappLink) {
          // Per WhatsApp, mostra il link invece di chiudere il form
          setWhatsappLink(data.whatsappLink);
          setInviteData({ email: '', phone: '', method: 'email', permission: 'read' });
          setShowInviteForm(false);
          setError('');
          await fetchShares();
        } else if (data.warning) {
          // Mostra un warning ma considera comunque l'invito creato
          alert(`Invito creato, ma: ${data.warning}\n\nPuoi condividere manualmente questo link:\n${data.inviteUrl || ''}`);
          setInviteData({ email: '', phone: '', method: 'email', permission: 'read' });
          setShowInviteForm(false);
          setError('');
          await fetchShares();
        } else {
          setInviteData({ email: '', phone: '', method: 'email', permission: 'read' });
          setShowInviteForm(false);
          setError('');
          await fetchShares();
        }
      } else {
        // Mostra errore dettagliato
        const errorMessage = data.error || data.details || 'Errore nell\'invio dell\'invito';
        console.error('[Share Page] API Error:', data);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error inviting:', error);
      setError('Si è verificato un errore durante l\'invio dell\'invito');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Rimuovere questa condivisione?')) return;

    try {
      const response = await fetch(`/api/share/${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchShares();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nella rimozione');
      }
    } catch (error) {
      console.error('Error removing share:', error);
      alert('Errore nella rimozione della condivisione');
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

  if (!session || !collection) {
    return null;
  }

  const breadcrumbs = [
    { label: 'Home Page', href: '/' },
    { label: collection.name, href: `/dashboard/collections/${collectionId}` },
    { label: 'Condivisione' },
  ];

  return (
    <DashboardLayout title={`Condividi: ${collection.name}`} breadcrumbs={breadcrumbs}>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-primary-800">Condivisioni</h3>
          <button
            onClick={() => setShowInviteForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            + Invita Utente
          </button>
        </div>

        {whatsappLink && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Link WhatsApp generato!</h4>
            <p className="text-sm text-green-700 mb-3">
              Clicca sul link qui sotto per aprire WhatsApp e inviare l&apos;invito:
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium mb-2"
            >
              📱 Apri WhatsApp
            </a>
            <div className="mt-3">
              <p className="text-xs text-green-600 mb-1">Oppure copia il link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={whatsappLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappLink);
                    alert('Link copiato!');
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Copia
                </button>
              </div>
            </div>
            <button
              onClick={() => setWhatsappLink(null)}
              className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
            >
              Chiudi
            </button>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <strong>Nota:</strong> Per inviare inviti via email, configura SMTP nella sezione Configurazione App.
          Per WhatsApp, viene generato un link che puoi condividere direttamente.
        </div>

        {showInviteForm && (
          <form onSubmit={handleInvite} className="mb-6 p-4 bg-primary-50 rounded-lg">
            <h4 className="font-semibold text-primary-800 mb-3">Nuovo Invito</h4>
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metodo
              </label>
              <select
                value={inviteData.method}
                onChange={(e) => setInviteData({ ...inviteData, method: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            {inviteData.method === 'email' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            {inviteData.method === 'whatsapp' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Telefono *
                </label>
                <input
                  type="tel"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                  required
                  placeholder="+39..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permesso
              </label>
              <select
                value={inviteData.permission}
                onChange={(e) => setInviteData({ ...inviteData, permission: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="read">Solo Lettura</option>
                <option value="full">Accesso Completo</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
              >
                {inviting ? 'Invio...' : 'Invia Invito'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteData({ email: '', phone: '', method: 'email', permission: 'read' });
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Annulla
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {!Array.isArray(shares) || shares.length === 0 ? (
            <p className="text-gray-600">Nessuna condivisione ancora</p>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-primary-800">
                      {share.user?.email || share.invitedBy}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Permesso: {share.permission === 'read' ? 'Solo Lettura' : 'Accesso Completo'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {share.accepted ? 'Accettato' : 'In attesa'} • {share.inviteMethod === 'email' ? 'Email' : 'WhatsApp'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(share.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

