'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Si è verificato un errore');
      }
    } catch (err) {
      setError('Si è verificato un errore durante la richiesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50 px-4">
      {/* Immagine di sfondo */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/hero-image.jpg" 
          alt="Sa-Ndo-Ka" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-primary-100/80 to-accent-yellow-50/80"></div>
      </div>

      <div className="relative max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-primary-200 p-8">
        <div className="text-center mb-8">
          <img src="/app-icon.jpg" alt="Sa-Ndo-Ka" className="h-20 w-20 mx-auto mb-4 rounded-lg" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-red text-transparent bg-clip-text">Sa-Ndo-Ka</h1>
          <p className="text-primary-700 mt-2">Recupera la tua password</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Se l&apos;email esiste nel nostro sistema, riceverai un link per reimpostare la password.
            </div>
            <Link
              href="/login"
              className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Torna al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Inserisci la tua email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Invio in corso...' : 'Invia link di reset'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 text-sm">
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}

