/**
 * Services de base de données
 *
 * Ce module exporte tous les services pour interagir avec la base de données.
 * Utilise Prisma comme ORM avec SQLite.
 */

// Client Prisma
export { disconnectPrisma, getPrismaClient } from './client';
export type {
    Exam, Room,
    RoomAssignment, School, Score, Student,
    Subject
} from './client';

// Service Exam
export * from './examService';

// Service School
export * from './schoolService';

// Service Student
export * from './studentService';

// Service Subject
export * from './subjectService';

// Service Score
export * from './scoreService';

// Service Room
export * from './roomService';

// Service Admin (gestion BD et sécurité)
export * from './admin';

