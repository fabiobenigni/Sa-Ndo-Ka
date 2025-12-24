// Script per inizializzare il database SQLite eseguendo le query SQL direttamente
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    let dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || '/app/data/sa-ndo-ka.db';
    
    if (!path.isAbsolute(dbPath)) {
      dbPath = path.resolve(process.cwd(), dbPath);
    }
    
    const dbDir = path.dirname(dbPath);
    
    console.log(`Inizializzazione database: ${dbPath}`);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Verifica se il database esiste e ha tabelle
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
      try {
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
        if (tables && tables.length > 0) {
          console.log('Database già inizializzato con', tables.length, 'tabelle');
          return;
        }
      } catch (error) {
        console.log('Database esistente ma vuoto, reinizializzo...');
        fs.unlinkSync(dbPath);
      }
    }
    
    console.log('Creazione schema database...');
    
    // Connetti al database (lo crea se non esiste)
    await prisma.$connect();
    
    // Abilita foreign keys
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    
    // Crea le tabelle in ordine di dipendenza
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "language" TEXT NOT NULL DEFAULT 'it',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
      
      CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expiresAt" DATETIME NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
      CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
      CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
      
      CREATE TABLE IF NOT EXISTS "AIConfig" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "apiKey" TEXT,
        "enabled" BOOLEAN NOT NULL DEFAULT false,
        "useFreeTier" BOOLEAN NOT NULL DEFAULT true,
        "freeTierUsed" INTEGER NOT NULL DEFAULT 0,
        "freeTierLimit" INTEGER NOT NULL DEFAULT 100,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE("userId", "provider")
      );
      
      CREATE INDEX IF NOT EXISTS "AIConfig_userId_idx" ON "AIConfig"("userId");
      
      CREATE TABLE IF NOT EXISTS "Collection" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "userId" TEXT NOT NULL,
        "deletedAt" DATETIME,
        "deletedBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "Collection_userId_idx" ON "Collection"("userId");
      CREATE INDEX IF NOT EXISTS "Collection_deletedAt_idx" ON "Collection"("deletedAt");
      
      CREATE TABLE IF NOT EXISTS "CollectionShare" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "collectionId" TEXT NOT NULL,
        "userId" TEXT,
        "permission" TEXT NOT NULL,
        "invitedBy" TEXT NOT NULL,
        "inviteMethod" TEXT,
        "accepted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "CollectionShare_userId_idx" ON "CollectionShare"("userId");
      CREATE INDEX IF NOT EXISTS "CollectionShare_collectionId_idx" ON "CollectionShare"("collectionId");
      CREATE INDEX IF NOT EXISTS "CollectionShare_collectionId_invitedBy_idx" ON "CollectionShare"("collectionId", "invitedBy");
      
      CREATE TABLE IF NOT EXISTS "Container" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "collectionId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "qrCode" TEXT NOT NULL UNIQUE,
        "deletedAt" DATETIME,
        "deletedBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "Container_collectionId_idx" ON "Container"("collectionId");
      CREATE INDEX IF NOT EXISTS "Container_userId_idx" ON "Container"("userId");
      CREATE INDEX IF NOT EXISTS "Container_qrCode_idx" ON "Container"("qrCode");
      CREATE INDEX IF NOT EXISTS "Container_deletedAt_idx" ON "Container"("deletedAt");
      
      CREATE TABLE IF NOT EXISTS "ObjectType" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "userId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS "ObjectType_userId_idx" ON "ObjectType"("userId");
      
      CREATE TABLE IF NOT EXISTS "Property" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "objectTypeId" TEXT NOT NULL,
        "required" BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("objectTypeId") REFERENCES "ObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "Property_objectTypeId_idx" ON "Property"("objectTypeId");
      
      CREATE TABLE IF NOT EXISTS "LookupValue" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE("propertyId", "value")
      );
      
      CREATE INDEX IF NOT EXISTS "LookupValue_propertyId_idx" ON "LookupValue"("propertyId");
      
      CREATE TABLE IF NOT EXISTS "Object" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "objectTypeId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "photoUrl" TEXT,
        "deletedAt" DATETIME,
        "deletedBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("objectTypeId") REFERENCES "ObjectType"("id") ON UPDATE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "Object_objectTypeId_idx" ON "Object"("objectTypeId");
      CREATE INDEX IF NOT EXISTS "Object_userId_idx" ON "Object"("userId");
      CREATE INDEX IF NOT EXISTS "Object_deletedAt_idx" ON "Object"("deletedAt");
      
      CREATE TABLE IF NOT EXISTS "ObjectProperty" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "objectId" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE("objectId", "propertyId")
      );
      
      CREATE INDEX IF NOT EXISTS "ObjectProperty_objectId_idx" ON "ObjectProperty"("objectId");
      CREATE INDEX IF NOT EXISTS "ObjectProperty_propertyId_idx" ON "ObjectProperty"("propertyId");
      
      CREATE TABLE IF NOT EXISTS "ContainerItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "containerId" TEXT NOT NULL,
        "objectId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE("containerId", "objectId")
      );
      
      CREATE INDEX IF NOT EXISTS "ContainerItem_containerId_idx" ON "ContainerItem"("containerId");
      CREATE INDEX IF NOT EXISTS "ContainerItem_objectId_idx" ON "ContainerItem"("objectId");
      CREATE INDEX IF NOT EXISTS "ContainerItem_userId_idx" ON "ContainerItem"("userId");
      
      CREATE TABLE IF NOT EXISTS "AppConfig" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
        "baseUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
        "smtpHost" TEXT,
        "smtpPort" TEXT,
        "smtpUser" TEXT,
        "smtpPass" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT
      );
      
      CREATE TABLE IF NOT EXISTS "TrashItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "itemType" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        "itemData" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "restoredAt" DATETIME,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "TrashItem_userId_idx" ON "TrashItem"("userId");
      CREATE INDEX IF NOT EXISTS "TrashItem_itemType_itemId_idx" ON "TrashItem"("itemType", "itemId");
      CREATE INDEX IF NOT EXISTS "TrashItem_deletedAt_idx" ON "TrashItem"("deletedAt");
      CREATE INDEX IF NOT EXISTS "TrashItem_restoredAt_idx" ON "TrashItem"("restoredAt");
    `;
    
    // Esegui le query SQL
    await prisma.$executeRawUnsafe(createTablesSQL);
    
    console.log('Database inizializzato con successo!');
    
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase().catch(console.error);

