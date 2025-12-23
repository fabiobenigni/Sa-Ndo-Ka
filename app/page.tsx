import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <img src="/icon.png" alt="Sa-Ndo-Ka" className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900">Sa-Ndo-Ka</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Accedi
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Registrati
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sa-Ndo-Ka - Catalogazione Intelligente
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Il sistema smart per organizzare contenitori e oggetti
          </p>
          <p className="text-lg text-gray-500">
            Scansiona il QR code e visualizza il contenuto senza nemmeno aprire il tappo.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Catalogazione flessibile</h3>
            <p className="text-gray-600">
              Crea tipi di oggetti personalizzati con caratteristiche dinamiche
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold mb-2">QR code per contenitori</h3>
            <p className="text-gray-600">
              Genera QR code per ogni contenitore e accedi velocemente
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Analisi AI delle foto</h3>
            <p className="text-gray-600">
              Analizza foto con AI per generare descrizioni automatiche
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Condivisione e collaborazione</h3>
            <p className="text-gray-600">
              Condividi collezioni con permessi personalizzabili
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 shadow-lg"
          >
            Inizia Ora
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">© 2024 Sa-Ndo-Ka. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

