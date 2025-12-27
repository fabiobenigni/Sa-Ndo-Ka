'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { signOut } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language: 'it',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          language: data.language || 'it',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profilo aggiornato con successo');
        setUserData(data);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Errore nell\'aggiornamento del profilo');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Si è verificato un errore durante l\'aggiornamento');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('La nuova password deve essere di almeno 8 caratteri');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password cambiata con successo');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Errore nel cambio password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Si è verificato un errore durante il cambio password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Caricamento...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'Home Page', href: '/' }, { label: 'Profilo Utente' }]}>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6">
        <h3 className="text-xl font-semibold text-primary-800 mb-4">Profilo Utente</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Form profilo */}
        <form onSubmit={handleUpdateProfile} className="space-y-6 mb-8">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              id="profile-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Il tuo nome"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="profile-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-language" className="block text-sm font-medium text-gray-700 mb-2">
              Lingua
            </label>
            <select
              id="profile-language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as 'it' | 'en' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        </form>

        {/* Cambio password */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-primary-800 mb-4">Cambia Password</h4>
          
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cambia Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password Attuale *
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-lg"
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuova Password * (min. 8 caratteri)
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-lg"
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Conferma Nuova Password *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-lg"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 font-medium disabled:opacity-50"
                >
                  {changingPassword ? 'Cambio in corso...' : 'Cambia Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Annulla
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Esci
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

