import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/app-icon.svg" alt="Sa-Ndo-Ka" className="h-12 w-12" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-red text-transparent bg-clip-text">
                Sa-Ndo-Ka
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-primary-700 hover:text-primary-900 font-medium hover:bg-primary-50 rounded-lg transition-colors"
              >
                Accedi
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Registrati
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section con immagine */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-700 via-accent-red to-primary-600 text-transparent bg-clip-text">
              Sa-Ndo-Ka
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-primary-800 mb-4">
              Catalogazione Intelligente
            </h3>
            <p className="text-xl text-primary-700 mb-4">
              Il sistema smart per organizzare contenitori e oggetti
            </p>
            <p className="text-lg text-primary-600 mb-6">
              Scansiona il QR code e visualizza il contenuto senza nemmeno aprire il tappo.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-red text-white text-lg font-semibold rounded-lg hover:from-primary-700 hover:to-accent-red/90 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Inizia Ora
            </Link>
          </div>
          <div className="relative">
            <img 
              src="/hero-image.svg" 
              alt="Sandokan eroico con QR code" 
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-primary-200 hover:shadow-xl hover:border-primary-300 transition-all">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2 text-primary-800">Catalogazione flessibile</h3>
            <p className="text-primary-700">
              Crea tipi di oggetti personalizzati con caratteristiche dinamiche
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-primary-200 hover:shadow-xl hover:border-primary-300 transition-all">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold mb-2 text-primary-800">QR code per contenitori</h3>
            <p className="text-primary-700">
              Genera QR code per ogni contenitore e accedi velocemente
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-primary-200 hover:shadow-xl hover:border-primary-300 transition-all">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-primary-800">Analisi AI delle foto</h3>
            <p className="text-primary-700">
              Analizza foto con AI per generare descrizioni automatiche
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-primary-200 hover:shadow-xl hover:border-primary-300 transition-all">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-primary-800">Condivisione e collaborazione</h3>
            <p className="text-primary-700">
              Condividi collezioni con permessi personalizzabili
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary-900 via-primary-800 to-accent-red mt-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-primary-200">© 2024 Sa-Ndo-Ka. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

