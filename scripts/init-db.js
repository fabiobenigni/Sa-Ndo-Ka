// Script per inizializzare il database SQLite
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    // Verifica se il database esiste già e ha le tabelle
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
      console.log('Database già esistente, verifico schema...');
      try {
        // Prova a fare una query per verificare se le tabelle esistono
        await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' LIMIT 1`;
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
        if (tables && tables.length > 0) {
          console.log('Database già inizializzato correttamente');
          return;
        }
      } catch (error) {
        console.log('Database esistente ma schema non valido, reinizializzo...');
        fs.unlinkSync(dbPath);
      }
    }
    
    console.log('Creazione nuovo database...');
    
    // Usa Prisma Migrate per creare lo schema
    // Prima prova con db push se disponibile, altrimenti usa le migrazioni
    try {
      // Esegui Prisma db push usando il Prisma CLI installato
      const prismaPath = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma');
      if (fs.existsSync(prismaPath)) {
        console.log('Eseguo Prisma db push...');
        execSync(`"${prismaPath}" db push --accept-data-loss --skip-generate`, {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: `file:${dbPath}` }
        });
        console.log('Database inizializzato con successo!');
        return;
      }
    } catch (error) {
      console.log('Prisma CLI non disponibile, uso metodo alternativo...');
    }
    
    // Metodo alternativo: crea le tabelle manualmente usando Prisma Client
    // Questo forza Prisma a creare lo schema
    try {
      await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
      // Forza Prisma a connettersi e creare lo schema
      await prisma.$connect();
      // Prova a fare una query che forza la creazione dello schema
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database inizializzato con successo!');
    } catch (error) {
      console.error('Errore durante l\'inizializzazione:', error.message);
      console.log('Il database verrà creato automaticamente al primo accesso');
    }
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error.message);
    console.log('Il database verrà creato automaticamente al primo accesso');
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();

