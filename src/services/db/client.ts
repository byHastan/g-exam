/**
 * Client Prisma - Instance unique pour l'application
 *
 * Ce module exporte une instance singleton du client Prisma
 * pour accéder à la base de données SQLite.
 */

import { PrismaClient } from '../../../generated/prisma/client';

// Instance singleton du client Prisma
let prismaInstance: PrismaClient | null = null;

/**
 * Retourne l'instance singleton du client Prisma
 * Crée l'instance si elle n'existe pas encore
 *
 * @returns Instance du client Prisma
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // @ts-expect-error - PrismaClient peut être instancié sans arguments selon la doc
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Ferme la connexion à la base de données
 * À appeler lors de la fermeture de l'application
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Réexporte les types Prisma pour les autres modules
 */
export type {
  Exam, Room,
  RoomAssignment, School, Score, Student,
  Subject
} from '../../../generated/prisma/client';

