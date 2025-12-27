'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import SearchBar from './SearchBar';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
}

export default function DashboardLayout({ children, breadcrumbs, title }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs) return breadcrumbs;
    
    const paths = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'Home Page', href: '/' }];
    
    if (paths.length === 0 || paths[0] === 'dashboard') {
      if (paths[1] === 'collections' && paths[2]) {
        items.push({ label: 'Collezione', href: `/dashboard/collections/${paths[2]}` });
      } else       if (paths[1] === 'settings') {
        items.push({ label: 'Impostazioni', href: '/dashboard/settings' });
      } else if (paths[1] === 'profile') {
        items.push({ label: 'Profilo Utente', href: '/dashboard/profile' });
      } else if (paths[1] === 'search') {
        items.push({ label: 'Ricerca', href: '/dashboard/search' });
      }
    } else if (paths[0] === 'container' && paths[1]) {
      items.push({ label: 'Contenitore', href: `/container/${paths[1]}` });
    }
    
    return items;
  };

  const currentBreadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50 overflow-x-hidden">
      {/* Immagine di sfondo */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/hero-image.jpg" 
          alt="Sa-Ndo-Ka" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-primary-100/80 to-accent-yellow-50/80"></div>
      </div>

      <header className="relative bg-white/90 backdrop-blur-sm shadow-md border-b border-primary-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 md:py-4">
          {/* Header principale */}
          <div className="flex justify-between items-center gap-2 md:gap-4">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
              <Link href="/" className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                <img src="/app-icon.jpg" alt="Sa-Ndo-Ka" className="h-8 w-8 md:h-10 md:w-10 rounded-lg" />
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-red text-transparent bg-clip-text">
                  Sa-Ndo-Ka
                </h1>
              </Link>
              
              {/* Breadcrumb */}
              {currentBreadcrumbs.length > 1 && (
                <nav className="hidden lg:flex items-center space-x-2 text-sm">
                  {currentBreadcrumbs.map((item, index) => (
                    <span key={index} className="flex items-center">
                      {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                      {item.href && index < currentBreadcrumbs.length - 1 ? (
                        <Link
                          href={item.href}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-gray-700 font-medium">{item.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
            </div>

            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              {/* Menu navigazione desktop */}
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/' || pathname === '/dashboard'
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Home Page
                </Link>
                <Link
                  href="/dashboard/settings"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pathname?.startsWith('/dashboard/settings')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Impostazioni
                </Link>
              </div>

              {/* Icona profilo utente desktop */}
              <Link
                href="/dashboard/profile"
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                aria-label="Profilo Utente"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              {/* Burger menu mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden px-2 py-2 text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-lg touch-manipulation"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-primary-200">
              <nav className="flex flex-col space-y-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors ${
                    pathname === '/' || pathname === '/dashboard'
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Home Page
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors ${
                    pathname?.startsWith('/dashboard/settings')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Impostazioni
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                    pathname?.startsWith('/dashboard/profile')
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profilo Utente</span>
                </Link>
                <Link
                  href="/logout"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  Esci
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Barra di ricerca separata sotto il titolo */}
      <div className="relative bg-white/90 backdrop-blur-sm border-b border-primary-200 py-4 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

