'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import DashboardLayout from '@/components/DashboardLayout';

export default function QRScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'file'>('file'); // Default a file per compatibilità
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Verifica se siamo su mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      setError('La scansione QR code è disponibile solo su dispositivi mobili');
      return;
    }

    return () => {
      // Cleanup quando il componente viene smontato
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {
          // Ignora errori durante lo stop
        });
      }
    };
  }, [html5QrCode]);

  const scanFromFile = async (file: File) => {
    try {
      setError(null);
      setScanning(true);

      const qrCode = new Html5Qrcode('qr-reader');
      
      const result = await qrCode.scanFile(file, false);
      
      // QR code scansionato con successo
      handleQRCodeScanned(result);
      
      // Cleanup
      qrCode.clear();
    } catch (err: any) {
      console.error('Error scanning QR from file:', err);
      if (err.message?.includes('No QR code')) {
        setError('Nessun QR code trovato nell\'immagine. Prova con un\'altra foto.');
      } else {
        setError(`Errore nella scansione: ${err.message || 'Errore sconosciuto'}`);
      }
      setScanning(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await scanFromFile(file);
    }
    // Reset input per permettere di selezionare lo stesso file di nuovo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      // Verifica se la fotocamera è disponibile
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('La fotocamera non è disponibile su questo dispositivo o browser.');
        setScanning(false);
        return;
      }

      // Richiedi permessi esplicitamente prima di avviare la scansione
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Chiudi lo stream temporaneo, Html5Qrcode lo gestirà
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError: any) {
        console.error('Permission error:', permissionError);
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setError('Permessi fotocamera negati. Abilita i permessi nelle impostazioni del browser e riprova.');
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
          setError('Nessuna fotocamera trovata sul dispositivo.');
        } else {
          setError(`Errore accesso fotocamera: ${permissionError.message || 'Errore sconosciuto'}`);
        }
        setScanning(false);
        return;
      }

      const qrCode = new Html5Qrcode('qr-reader');
      
      await qrCode.start(
        { facingMode: 'environment' }, // Usa la fotocamera posteriore
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
          },
        },
        (decodedText) => {
          // QR code scansionato con successo
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignora errori di scansione continua (non critici)
          // Questi sono errori durante la scansione, non errori di accesso
        }
      );

      setHtml5QrCode(qrCode);
    } catch (err: any) {
      console.error('Error starting QR scanner:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permessi fotocamera negati. Abilita i permessi nelle impostazioni del browser e riprova.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Nessuna fotocamera trovata sul dispositivo.');
      } else if (err.message?.includes('HTTPS')) {
        setError('L\'accesso alla fotocamera richiede HTTPS. Assicurati di accedere all\'app tramite HTTPS.');
      } else {
        setError(`Impossibile accedere alla fotocamera: ${err.message || 'Errore sconosciuto'}. Verifica i permessi nelle impostazioni del browser.`);
      }
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        await html5QrCode.clear();
        setHtml5QrCode(null);
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleQRCodeScanned = (decodedText: string) => {
    try {
      // Estrai l'ID del contenitore dall'URL
      // Il formato può essere: ${baseUrl}/container/${containerId} o solo /container/${containerId}
      let pathParts: string[] = [];
      
      try {
        const url = new URL(decodedText);
        pathParts = url.pathname.split('/').filter(Boolean);
      } catch {
        // Se non è un URL completo, prova come path relativo
        if (decodedText.includes('/container/')) {
          const match = decodedText.match(/\/container\/([^\/\?]+)/);
          if (match && match[1]) {
            const containerId = match[1];
            stopScanning();
            router.push(`/container/${containerId}`);
            return;
          }
        }
        throw new Error('URL non valido');
      }
      
      if (pathParts.length >= 2 && pathParts[0] === 'container') {
        const containerId = pathParts[1];
        
        // Ferma la scansione
        stopScanning();
        
        // Reindirizza alla pagina del contenitore
        router.push(`/container/${containerId}`);
      } else {
        setError('QR code non valido. Il QR code deve puntare a un contenitore Sa-Ndo-Ka.');
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error parsing QR code:', err);
      setError('QR code non valido. Verifica che il QR code sia corretto.');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Home Page', href: '/' },
        { label: 'Scansiona QR Code', href: '/dashboard/qr-scan' },
      ]}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-4">
            Scansiona QR Code
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Toggle tra modalità file e camera */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setScanMode('file');
                  if (html5QrCode) {
                    stopScanning();
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  scanMode === 'file'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📷 Scatta Foto
              </button>
              <button
                onClick={() => {
                  setScanMode('camera');
                  if (html5QrCode) {
                    stopScanning();
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  scanMode === 'camera'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎥 Video Live
              </button>
            </div>

            {scanMode === 'file' ? (
              <>
                <p className="text-gray-700 text-center">
                  Scatta una foto del QR code o seleziona un&apos;immagine dalla galleria.
                </p>
                <div className="flex flex-col items-center space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                    id="qr-file-input"
                  />
                  <label
                    htmlFor="qr-file-input"
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium cursor-pointer text-center"
                  >
                    {scanning ? 'Scansione in corso...' : '📷 Scatta Foto o Seleziona Immagine'}
                  </label>
                  {scanning && (
                    <div className="text-sm text-gray-600">
                      Analisi dell&apos;immagine in corso...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Nota:</strong> La modalità video richiede HTTPS e permessi fotocamera.
                  </p>
                </div>

                <p className="text-gray-700">
                  Posiziona il QR code del contenitore all&apos;interno del riquadro per scansionarlo.
                </p>

                <div id="qr-reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-primary-300 bg-black"></div>

                {!scanning ? (
                  <div className="flex justify-center">
                    <button
                      onClick={startScanning}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                      Avvia Scansione Video
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      onClick={stopScanning}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Ferma Scansione
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

