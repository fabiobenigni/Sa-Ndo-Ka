'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import DashboardLayout from '@/components/DashboardLayout';

export default function QRScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

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

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      const qrCode = new Html5Qrcode('qr-reader');
      
      await qrCode.start(
        { facingMode: 'environment' }, // Usa la fotocamera posteriore
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code scansionato con successo
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignora errori di scansione continua
        }
      );

      setHtml5QrCode(qrCode);
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError('Impossibile accedere alla fotocamera. Verifica i permessi.');
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
      // Il formato è: ${baseUrl}/container/${containerId}
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
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
            <p className="text-gray-700">
              Posiziona il QR code del contenitore all&apos;interno del riquadro per scansionarlo.
            </p>

            <div id="qr-reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-primary-300"></div>

            {!scanning ? (
              <div className="flex justify-center">
                <button
                  onClick={startScanning}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Avvia Scansione
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

