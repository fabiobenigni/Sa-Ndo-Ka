'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Verifica che il token sia valido
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        if (!response.ok) {
          setError('Link non valido o scaduto');
        }
      } catch (err) {
        setError('Errore nella validazione del token');
      } finally {
        setValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setError('Token mancante');
      setValidating(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Si è verificato un errore');
      }
    } catch (err) {
      setError('Si è verificato un errore durante il reset della password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
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
        <div className="relative max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-primary-200 p-8 text-center">
          <p className="text-primary-700">Validazione in corso...</p>
        </div>
      </div>
    );
  }

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
          <p className="text-primary-700 mt-2">Imposta una nuova password</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Password reimpostata con successo! Verrai reindirizzato al login...
            </div>
          </div>
        ) : error && error.includes('non valido') ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
            <Link
              href="/forgot-password"
              className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Richiedi un nuovo link
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nuova Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Conferma Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Reimpostazione...' : 'Reimposta password'}
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

