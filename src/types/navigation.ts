/**
 * Types pour la navigation de l'application
 * Définit les pages disponibles et la structure du menu
 */

// Identifiants des pages de l'application
export type PageId =
  | 'dashboard'
  | 'exam-setup'
  | 'schools'
  | 'students'
  | 'subjects'
  | 'scores'
  | 'rankings'
  | 'statistics'
  | 'rooms'
  | 'exports'
  | 'settings'
  | 'admin';

// Structure d'un item de menu
export interface MenuItem {
  id: PageId;
  label: string;
  icon: string; // Nom de l'icône Lucide
  description?: string;
}

// Configuration du menu de navigation
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'LayoutDashboard',
    description: 'Vue d\'ensemble de l\'examen',
  },
  {
    id: 'exam-setup',
    label: 'Configuration',
    icon: 'Settings',
    description: 'Paramètres de l\'examen',
  },
  {
    id: 'schools',
    label: 'Établissements',
    icon: 'Building2',
    description: 'Gestion des établissements',
  },
  {
    id: 'students',
    label: 'Élèves',
    icon: 'Users',
    description: 'Liste des candidats',
  },
  {
    id: 'subjects',
    label: 'Épreuves',
    icon: 'FileText',
    description: 'Matières et coefficients',
  },
  {
    id: 'scores',
    label: 'Notes',
    icon: 'PenLine',
    description: 'Saisie des notes',
  },
  {
    id: 'rankings',
    label: 'Classements',
    icon: 'Trophy',
    description: 'Classements élèves et établissements',
  },
  {
    id: 'statistics',
    label: 'Statistiques',
    icon: 'BarChart3',
    description: 'Analyses et graphiques',
  },
  {
    id: 'rooms',
    label: 'Salles',
    icon: 'DoorOpen',
    description: 'Répartition en salles',
  },
  {
    id: 'exports',
    label: 'Exports',
    icon: 'Download',
    description: 'Export PDF et Excel',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: 'SlidersHorizontal',
    description: 'Mentions, documents et configuration',
  },
];

// Titres des pages pour l'affichage
export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Tableau de bord',
  'exam-setup': 'Configuration de l\'examen',
  schools: 'Établissements',
  students: 'Élèves',
  subjects: 'Épreuves',
  scores: 'Saisie des notes',
  rankings: 'Classements',
  statistics: 'Statistiques',
  rooms: 'Répartition en salles',
  exports: 'Exports',
  settings: 'Paramètres',
  admin: 'Administration',
};
