'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: `${window.location.origin}/`,
      });

      if (result?.error) {
        setError('Email o password non corretti');
      } else if (result?.ok) {
        // Usa window.location invece di router.push per forzare il reload completo
        window.location.href = '/';
      } else {
        setError('Si è verificato un errore durante il login. Riprova.');
      }
    } catch (err) {
      setError('Si è verificato un errore');
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
          <p className="text-primary-700 mt-2">Accedi al tuo account</p>
        </div>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                style={{
                  WebkitTextFillColor: 'rgb(17, 24, 39)',
                  color: 'rgb(17, 24, 39)',
                }}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-4 rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <div>
            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm">
              Password dimenticata?
            </Link>
          </div>
          <div>
            <Link href="/register" className="text-primary-600 hover:text-primary-700">
              Non hai un account? Registrati
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

