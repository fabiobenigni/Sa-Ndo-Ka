'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

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

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs) return breadcrumbs;
    
    const paths = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/dashboard' }];
    
    if (paths[0] === 'dashboard') {
      if (paths[1] === 'collections' && paths[2]) {
        items.push({ label: 'Collezione', href: `/dashboard/collections/${paths[2]}` });
      } else if (paths[1] === 'settings') {
        items.push({ label: 'Impostazioni', href: '/dashboard/settings' });
      }
    } else if (paths[0] === 'container' && paths[1]) {
      items.push({ label: 'Contenitore', href: `/container/${paths[1]}` });
    }
    
    return items;
  };

  const currentBreadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-primary-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <img src="/app-icon.jpg" alt="Sa-Ndo-Ka" className="h-10 w-10 rounded-lg" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-red text-transparent bg-clip-text">
                  Sa-Ndo-Ka
                </h1>
              </Link>
              
              {/* Breadcrumb */}
              {currentBreadcrumbs.length > 1 && (
                <nav className="hidden md:flex items-center space-x-2 text-sm">
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

            <div className="flex items-center space-x-4">
              {/* Menu navigazione */}
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Dashboard
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

              {/* Pulsante indietro mobile */}
              {currentBreadcrumbs.length > 1 && (
                <button
                  onClick={() => router.back()}
                  className="md:hidden px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  aria-label="Indietro"
                >
                  ←
                </button>
              )}

              <span className="text-primary-700 font-medium text-sm">{session?.user?.email}</span>
              <Link
                href="/logout"
                className="px-4 py-2 text-primary-700 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors text-sm"
              >
                Esci
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

