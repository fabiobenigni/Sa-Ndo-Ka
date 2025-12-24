import { prisma } from './db';

export async function getBaseUrl(): Promise<string> {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { id: 'singleton' },
    });
    return config?.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  } catch (error) {
    // Se il modello non esiste ancora, usa l'env o default
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }
}

export async function setBaseUrl(baseUrl: string, userId?: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { id: 'singleton' },
    update: { baseUrl, updatedBy: userId },
    create: { id: 'singleton', baseUrl, updatedBy: userId },
  });
}

