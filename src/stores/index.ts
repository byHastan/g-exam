/**
 * Exports des stores Zustand
 */

export { useExamStore } from './examStore';
export type { ExamStatus } from './examStore';

export { useNavigationStore } from './navigationStore';

export { useSchoolsStore } from './schoolsStore';
export type { School } from './schoolsStore';

export { useStudentsStore } from './studentsStore';
export type { Student, CreateStudentInput } from './studentsStore';

export { useSubjectsStore } from './subjectsStore';
export type { Subject, CreateSubjectInput } from './subjectsStore';

export { useScoresStore } from './scoresStore';
export type { Score, StudentWithAverage } from './scoresStore';

export { useSecurityStore } from './securityStore';
