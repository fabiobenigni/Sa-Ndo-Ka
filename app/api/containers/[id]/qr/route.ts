import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getBaseUrl } from '@/lib/app-config';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

// Colori Sa-Ndo-Ka (RGB)
const PRIMARY_COLOR = { r: 234, g: 88, b: 12 }; // arancione #ea580c

// Dimensioni etichetta Avery 105x148-R (in mm)
// Nota: Le etichette sono 105mm x 148mm
// Su A4 landscape (297mm x 210mm):
// - 2 righe: 148mm * 2 = 296mm (1mm margine totale in larghezza)
// - 2 colonne: 105mm * 2 = 210mm (0mm margine in altezza)
const LABEL_WIDTH = 105;  // larghezza etichetta
const LABEL_HEIGHT = 148; // altezza etichetta

// Dimensioni pagina A4 landscape
const PAGE_WIDTH = 297;  // larghezza pagina
const PAGE_HEIGHT = 210; // altezza pagina

// Calcolo margini ottimali per centrare le 4 etichette
// 2 righe: 148mm * 2 = 296mm -> margine X = (297 - 296) / 2 = 0.5mm per lato
// 2 colonne: 105mm * 2 = 210mm -> margine Y = (210 - 210) / 2 = 0mm
const MARGIN_X = (PAGE_WIDTH - LABEL_HEIGHT * 2) / 2; // margine laterale (0.5mm)
const MARGIN_Y = (PAGE_HEIGHT - LABEL_WIDTH * 2) / 2;  // margine superiore/inferiore (0mm)
const GAP_X = 0; // gap tra colonne
const GAP_Y = 0; // gap tra righe

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const container = await prisma.container.findFirst({
      where: {
        id: params.id,
        collection: {
          OR: [
            { userId: session.user.id },
            {
              shares: {
                some: {
                  userId: session.user.id,
                  accepted: true,
                },
              },
            },
          ],
        },
      },
    });

    if (!container) {
      return NextResponse.json(
        { error: 'Contenitore non trovato' },
        { status: 404 }
      );
    }

    // Ottieni base URL dalla configurazione
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/container/${container.id}`;

    // Genera QR code come data URL (con colori ma leggibile in B&N)
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000', // Nero per moduli scuri (garantisce leggibilità in B&N)
        light: '#FFFFFF', // Bianco per sfondo
      },
      errorCorrectionLevel: 'M',
    });

    // Carica icona se disponibile
    let iconData: string | null = null;
    try {
      const iconPath = path.join(process.cwd(), 'public', 'app-icon.jpg');
      if (fs.existsSync(iconPath)) {
        const iconBuffer = fs.readFileSync(iconPath);
        iconData = `data:image/jpeg;base64,${iconBuffer.toString('base64')}`;
      }
    } catch (error) {
      console.error('Error loading icon:', error);
    }

    // Crea PDF in landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Estrai dati immagine QR code
    const qrImgData = qrCodeDataUrl.split(',')[1];

    // Genera 4 etichette (2x2)
    // Layout: 2 righe x 2 colonne
    // Pagina A4 landscape: 297mm (larghezza) x 210mm (altezza)
    // Etichetta Avery 105x148-R: 105mm (larghezza) x 148mm (altezza)
    // 
    // Le etichette sono ruotate di 90° per utilizzare meglio lo spazio:
    // - Dopo rotazione: larghezza=148mm, altezza=105mm
    // - 2 righe: 148mm * 2 = 296mm (quasi tutta la larghezza pagina, margine 0.5mm per lato)
    // - 2 colonne: 105mm * 2 = 210mm (perfetto per altezza pagina, margine 0mm)
    // 
    // Coordinate PDF (jsPDF):
    // - X: da sinistra a destra (0 a 297mm)
    // - Y: dall'alto al basso (0 a 210mm)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        // Posizione: le etichette sono disposte in 2 righe (orizzontali) e 2 colonne (verticali)
        // Row 0: riga superiore, Row 1: riga inferiore
        // Col 0: colonna sinistra, Col 1: colonna destra
        const x = MARGIN_X + row * LABEL_HEIGHT; // riga determina posizione X (orizzontale)
        const y = MARGIN_Y + col * LABEL_WIDTH;  // colonna determina posizione Y (verticale)

        // Colori per header/footer
        pdf.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
        pdf.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);

        // Header (barra superiore) - lungo la larghezza dell'etichetta ruotata (148mm)
        const headerHeight = 12;
        pdf.rect(x, y, LABEL_HEIGHT, headerHeight, 'F');
        
        // Testo header
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sa-Ndo-Ka', x + LABEL_HEIGHT / 2, y + 8, { align: 'center' });

        // Footer (barra inferiore)
        const footerHeight = 8;
        pdf.rect(x, y + LABEL_WIDTH - footerHeight, LABEL_HEIGHT, footerHeight, 'F');
        
        // Testo footer
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text('www.sa-ndo-ka.com', x + LABEL_HEIGHT / 2, y + LABEL_WIDTH - 3, { align: 'center' });

        // Area contenuto (tra header e footer)
        const contentY = y + headerHeight;

        // Nome contenitore - calcola dimensione font ottimale per massimizzare la leggibilità
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        const containerNameY = contentY + 10;
        const maxNameWidth = LABEL_HEIGHT - 20; // Larghezza disponibile per il testo (128mm con margini)
        
        // Calcola dimensione font ottimale in base alla lunghezza del nome
        // Prova diverse dimensioni e scegli la più grande che entra nello spazio disponibile
        let fontSize = 28; // Inizia con una dimensione grande
        const minFontSize = 14; // Dimensione minima per leggibilità
        
        // Trova la dimensione ottimale iterando
        while (fontSize >= minFontSize) {
          pdf.setFontSize(fontSize);
          const currentTextWidth = pdf.getTextWidth(container.name);
          if (currentTextWidth <= maxNameWidth) {
            break; // La dimensione attuale va bene
          }
          fontSize -= 0.5; // Riduci di 0.5mm per precisione
        }
        
        // Assicurati che la dimensione non sia inferiore al minimo
        if (fontSize < minFontSize) {
          fontSize = minFontSize;
        }
        
        pdf.setFontSize(fontSize);
        pdf.text(container.name, x + LABEL_HEIGHT / 2, containerNameY, { 
          align: 'center',
          maxWidth: maxNameWidth,
        });

        // Icona Sa-Ndo-Ka (a sinistra)
        if (iconData) {
          try {
            const iconSize = 15;
            const iconX = x + 5;
            const iconY = containerNameY + 5;
            const iconImgData = iconData.split(',')[1];
            pdf.addImage(iconImgData, 'JPEG', iconX, iconY, iconSize, iconSize);
          } catch (error) {
            console.error('Error adding icon to PDF:', error);
          }
        }

        // QR Code
        const qrSize = 50;
        const qrX = x + (LABEL_HEIGHT - qrSize) / 2;
        const qrY = containerNameY + 12;

        // Bordo colorato attorno al QR code
        const borderSize = 2;
        pdf.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
        pdf.rect(qrX - borderSize, qrY - borderSize, qrSize + borderSize * 2, qrSize + borderSize * 2, 'F');

        // Aggiungi QR code al PDF
        pdf.addImage(qrImgData, 'PNG', qrX, qrY, qrSize, qrSize);
      }
    }

    const pdfBlob = pdf.output('blob');
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="qr-${container.name}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating QR PDF:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione del PDF' },
      { status: 500 }
    );
  }
}

