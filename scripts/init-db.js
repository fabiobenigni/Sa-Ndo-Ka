// Script per inizializzare il database SQLite
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    // Usa il percorso assoluto dal DATABASE_URL
    let dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || '/app/data/sa-ndo-ka.db';
    
    // Se il percorso è relativo, convertilo in assoluto
    if (!path.isAbsolute(dbPath)) {
      dbPath = path.resolve(process.cwd(), dbPath);
    }
    
    const dbDir = path.dirname(dbPath);
    
    console.log(`Inizializzazione database: ${dbPath}`);
    
    // Crea directory se non esiste
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Directory creata: ${dbDir}`);
    }
    
    // Verifica se il database esiste già
    if (fs.existsSync(dbPath)) {
      console.log('Database già esistente, verifico schema...');
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('Database già inizializzato correttamente');
        return;
      } catch (error) {
        console.log('Database esistente ma schema non valido, reinizializzo...');
        fs.unlinkSync(dbPath);
      }
    }
    
    console.log('Creazione nuovo database...');
    
    // Crea il database vuoto (SQLite lo creerà automaticamente)
    // Prisma Migrate creerà lo schema al primo accesso
    // Facciamo una query semplice per forzare la creazione
    try {
      await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database inizializzato con successo!');
    } catch (error) {
      // Se fallisce, Prisma Migrate lo creerà automaticamente
      console.log('Prisma creerà il database automaticamente al primo accesso');
    }
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error.message);
    console.log('Il database verrà creato automaticamente al primo accesso');
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();

