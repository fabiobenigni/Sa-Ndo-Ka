'use client';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function ErrorModal({ isOpen, onClose, title, message }: ErrorModalProps) {
  if (!isOpen) return null;

  // Debug logging
  console.log('ErrorModal renderizzato:', { isOpen, title, message: message.substring(0, 100) });

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      alert('Messaggio copiato negli appunti!');
    }).catch(() => {
      // Fallback per browser che non supportano clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Messaggio copiato negli appunti!');
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-primary-200 p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h3 className="text-2xl font-bold text-primary-800 mb-4">{title}</h3>
        
        <div className="flex-1 overflow-y-auto mb-4">
          <textarea
            readOnly
            value={message}
            className="w-full h-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 bg-gray-50 resize-none"
            onClick={(e) => {
              (e.target as HTMLTextAreaElement).select();
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            📋 Copia messaggio
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

