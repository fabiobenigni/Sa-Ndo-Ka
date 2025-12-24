import { prisma } from './db';

/**
 * Soft delete di una collezione e di tutti i suoi contenitori e oggetti
 */
export async function softDeleteCollection(collectionId: string, userId: string) {
  const now = new Date();

  // Recupera la collezione con tutti i dati necessari
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      containers: {
        include: {
          items: {
            include: {
              object: true,
            },
          },
        },
      },
    },
  });

  if (!collection) {
    throw new Error('Collezione non trovata');
  }

  // Salva nel cestino
  await prisma.trashItem.create({
    data: {
      itemType: 'collection',
      itemId: collectionId,
      itemData: JSON.stringify(collection),
      userId,
    },
  });

  // Soft delete della collezione
  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      deletedAt: now,
      deletedBy: userId,
    },
  });

  // Soft delete di tutti i contenitori
  for (const container of collection.containers) {
    await softDeleteContainer(container.id, userId, false); // false = non salvare nel cestino (già incluso nella collezione)
  }

  return collection;
}

/**
 * Soft delete di un contenitore e di tutti i suoi oggetti
 */
export async function softDeleteContainer(containerId: string, userId: string, saveToTrash = true) {
  const now = new Date();

  // Recupera il contenitore con tutti i dati necessari
  const container = await prisma.container.findUnique({
    where: { id: containerId },
    include: {
      items: {
        include: {
          object: true,
        },
      },
    },
  });

  if (!container) {
    throw new Error('Contenitore non trovato');
  }

  // Salva nel cestino solo se non è già incluso in una collezione eliminata
  if (saveToTrash) {
    await prisma.trashItem.create({
      data: {
        itemType: 'container',
        itemId: containerId,
        itemData: JSON.stringify(container),
        userId,
      },
    });
  }

  // Soft delete del contenitore
  await prisma.container.update({
    where: { id: containerId },
    data: {
      deletedAt: now,
      deletedBy: userId,
    },
  });

  // Soft delete di tutti gli oggetti nel contenitore
  for (const item of container.items) {
    if (item.object && !item.object.deletedAt) {
      await softDeleteObject(item.object.id, userId, false); // false = non salvare nel cestino (già incluso nel contenitore)
    }
  }

  return container;
}

/**
 * Soft delete di un oggetto
 */
export async function softDeleteObject(objectId: string, userId: string, saveToTrash = true) {
  const now = new Date();

  // Recupera l'oggetto con tutti i dati necessari
  const object = await prisma.object.findUnique({
    where: { id: objectId },
    include: {
      properties: {
        include: {
          property: true,
        },
      },
      containers: {
        include: {
          container: true,
        },
      },
    },
  });

  if (!object) {
    throw new Error('Oggetto non trovato');
  }

  // Salva nel cestino solo se non è già incluso in un contenitore/collezione eliminata
  if (saveToTrash) {
    await prisma.trashItem.create({
      data: {
        itemType: 'object',
        itemId: objectId,
        itemData: JSON.stringify(object),
        userId,
      },
    });
  }

  // Soft delete dell'oggetto
  await prisma.object.update({
    where: { id: objectId },
    data: {
      deletedAt: now,
      deletedBy: userId,
    },
  });

  return object;
}

/**
 * Ripristina una collezione e tutti i suoi contenitori e oggetti
 */
export async function restoreCollection(trashItemId: string) {
  const trashItem = await prisma.trashItem.findUnique({
    where: { id: trashItemId },
  });

  if (!trashItem || trashItem.restoredAt) {
    throw new Error('Elemento non trovato o già ripristinato');
  }

  const collectionData = JSON.parse(trashItem.itemData);

  // Ripristina la collezione
  await prisma.collection.update({
    where: { id: collectionData.id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });

  // Ripristina tutti i contenitori associati
  const containerTrashItems = await prisma.trashItem.findMany({
    where: {
      itemType: 'container',
      itemData: {
        contains: `"collectionId":"${collectionData.id}"`,
      },
      restoredAt: null,
    },
  });

  for (const item of containerTrashItems) {
    await restoreContainer(item.id);
  }

  // Marca come ripristinato
  await prisma.trashItem.update({
    where: { id: trashItemId },
    data: { restoredAt: new Date() },
  });

  return collectionData;
}

/**
 * Ripristina un contenitore e tutti i suoi oggetti
 */
export async function restoreContainer(trashItemId: string) {
  const trashItem = await prisma.trashItem.findUnique({
    where: { id: trashItemId },
  });

  if (!trashItem || trashItem.restoredAt) {
    throw new Error('Elemento non trovato o già ripristinato');
  }

  const containerData = JSON.parse(trashItem.itemData);

  // Ripristina il contenitore
  await prisma.container.update({
    where: { id: containerData.id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });

  // Ripristina tutti gli oggetti associati
  const objectTrashItems = await prisma.trashItem.findMany({
    where: {
      itemType: 'object',
      restoredAt: null,
    },
  });

  // Filtra solo gli oggetti che erano in questo contenitore
  for (const item of objectTrashItems) {
    const objectData = JSON.parse(item.itemData);
    const wasInContainer = containerData.items?.some(
      (ci: any) => ci.objectId === objectData.id
    );
    if (wasInContainer) {
      await restoreObject(item.id);
    }
  }

  // Marca come ripristinato
  await prisma.trashItem.update({
    where: { id: trashItemId },
    data: { restoredAt: new Date() },
  });

  return containerData;
}

/**
 * Ripristina un oggetto
 */
export async function restoreObject(trashItemId: string) {
  const trashItem = await prisma.trashItem.findUnique({
    where: { id: trashItemId },
  });

  if (!trashItem || trashItem.restoredAt) {
    throw new Error('Elemento non trovato o già ripristinato');
  }

  const objectData = JSON.parse(trashItem.itemData);

  // Ripristina l'oggetto
  await prisma.object.update({
    where: { id: objectData.id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });

  // Marca come ripristinato
  await prisma.trashItem.update({
    where: { id: trashItemId },
    data: { restoredAt: new Date() },
  });

  return objectData;
}

/**
 * Elimina fisicamente gli elementi nel cestino da più di 30 giorni
 */
export async function permanentlyDeleteOldTrashItems() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldTrashItems = await prisma.trashItem.findMany({
    where: {
      deletedAt: {
        lt: thirtyDaysAgo,
      },
      restoredAt: null,
    },
  });

  for (const item of oldTrashItems) {
    try {
      switch (item.itemType) {
        case 'collection':
          await prisma.collection.deleteMany({
            where: { id: item.itemId },
          });
          break;
        case 'container':
          await prisma.container.deleteMany({
            where: { id: item.itemId },
          });
          break;
        case 'object':
          await prisma.object.deleteMany({
            where: { id: item.itemId },
          });
          break;
      }
      // Elimina anche il record del cestino
      await prisma.trashItem.delete({
        where: { id: item.id },
      });
    } catch (error) {
      console.error(`Error permanently deleting ${item.itemType} ${item.itemId}:`, error);
    }
  }

  return oldTrashItems.length;
}

