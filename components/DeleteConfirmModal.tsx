'use client';

import { useState } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  itemType: 'collection' | 'container' | 'object' | 'objectType' | 'property' | 'share';
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'collection':
        return 'collezione';
      case 'container':
        return 'contenitore';
      case 'object':
        return 'oggetto';
      case 'objectType':
        return 'tipo di oggetto';
      case 'property':
        return 'proprietà';
      case 'share':
        return 'condivisione';
      default:
        return 'elemento';
    }
  };

  const getCascadeMessage = () => {
    switch (itemType) {
      case 'collection':
        return 'Questa operazione eliminerà anche tutti i contenitori e oggetti associati alla collezione.';
      case 'container':
        return 'Questa operazione eliminerà anche tutti gli oggetti presenti nel contenitore.';
      case 'object':
        return 'L\'oggetto verrà spostato nel cestino e potrà essere ripristinato entro 30 giorni.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-primary-200 p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-red-600 mb-2">{title}</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-semibold mb-2">
              ⚠️ Attenzione: Questa operazione è irreversibile!
            </p>
            <p className="text-red-700 text-sm mb-2">
              Stai per eliminare la {getItemTypeLabel()} <strong>"{itemName}"</strong>.
            </p>
            {getCascadeMessage() && (
              <p className="text-red-700 text-sm mb-2">
                {getCascadeMessage()}
              </p>
            )}
            <p className="text-red-700 text-sm">
              {message || 'L\'elemento verrà spostato nel cestino e potrà essere ripristinato entro 30 giorni. Dopo questo periodo verrà eliminato definitivamente.'}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Eliminazione...' : 'Elimina definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}

