// Configurazione applicazione

export const config = {
  // Limiti storage (valori molto alti per ora)
  maxPhotoSize: 50 * 1024 * 1024, // 50MB
  maxPhotosPerUser: 1000000, // 1 milione
  maxStoragePerUser: 1000 * 1024 * 1024 * 1024, // 1TB

  // QR Code
  qrCodeSize: 512,
  
  // AI
  aiProviders: ['openai', 'anthropic', 'google'] as const,
  
  // Lingue supportate
  supportedLanguages: ['it', 'en', 'es', 'fr', 'de'] as const,
  
  // Permessi
  permissions: ['read', 'write', 'delete'] as const,
} as const;

export type AIConfig = {
  provider: typeof config.aiProviders[number];
  apiKey?: string;
  enabled: boolean;
};

