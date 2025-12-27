'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorField(null);
    setSuccess(false);

    // Validazione lato client
    if (!formData.name.trim()) {
      setError('Il nome è obbligatorio');
      setErrorField('name');
      return;
    }

    if (!formData.email.trim()) {
      setError('L&apos;email è obbligatoria');
      setErrorField('email');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Inserisci un&apos;email valida');
      setErrorField('email');
      return;
    }

    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setErrorField('password');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      setErrorField('confirmPassword');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostra l'errore specifico dal server
        setError(data.error || 'Errore durante la registrazione');
        setErrorField(data.field || null);
      } else {
        // Successo - mostra messaggio e reindirizza
        setSuccess(true);
        setError('');
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 1500);
      }
    } catch (err) {
      setError('Errore di connessione. Verifica la tua connessione internet e riprova.');
      console.error('Registration error:', err);
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
          <p className="text-primary-700 mt-2">Crea il tuo account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Account creato con successo! Reindirizzamento al login...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errorField === 'name') {
                  setError('');
                  setErrorField(null);
                }
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                errorField === 'name' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errorField === 'email') {
                  setError('');
                  setErrorField(null);
                }
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                errorField === 'email' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errorField === 'email' && (
              <p className="mt-1 text-sm text-red-600">Controlla che l&apos;email sia corretta e non sia già registrata</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errorField === 'password') {
                  setError('');
                  setErrorField(null);
                }
              }}
              required
              minLength={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                errorField === 'password' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errorField === 'password' && (
              <p className="mt-1 text-sm text-red-600">La password deve essere di almeno 6 caratteri</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Conferma password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errorField === 'confirmPassword') {
                  setError('');
                  setErrorField(null);
                }
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                errorField === 'confirmPassword' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
            />
            {errorField === 'confirmPassword' && (
              <p className="mt-1 text-sm text-red-600">Le password non corrispondono</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-primary-600 hover:text-primary-700">
            Hai già un account? Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}

