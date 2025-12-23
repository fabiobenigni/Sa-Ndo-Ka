import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

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

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const url = `${origin}/container/${container.id}`;
    
    // Genera QR code come data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
    });

    // Crea PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Titolo
    pdf.setFontSize(20);
    pdf.text(container.name, pageWidth / 2, 30, { align: 'center' });

    // Descrizione se presente
    if (container.description) {
      pdf.setFontSize(12);
      pdf.text(container.description, pageWidth / 2, 40, { align: 'center' });
    }

    // QR Code (centrato)
    const qrSize = 80; // mm
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 60;

    // Converti data URL a base64 e aggiungi al PDF
    const imgData = qrCodeDataUrl.split(',')[1];
    pdf.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);

    // URL testuale
    pdf.setFontSize(10);
    pdf.text(url, pageWidth / 2, qrY + qrSize + 10, { align: 'center' });

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

