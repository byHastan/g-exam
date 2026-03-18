/**
 * Store Zustand pour les paramètres de l'application
 * Gère les mentions, la personnalisation des documents, et la configuration générale
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

/** Seuil de mention */
export interface MentionThreshold {
  id: string;
  label: string;
  minScore: number; // Seuil minimum (inclus)
  color: string;    // Couleur d'affichage (hex)
}

/** Configuration de personnalisation des documents */
export interface DocumentConfig {
  // En-tête
  headerTitle: string;       // Titre principal (ex: "République du Cameroun")
  headerSubtitle: string;    // Sous-titre (ex: "Ministère de l'Éducation")
  institutionName: string;   // Nom de l'institution
  logoEnabled: boolean;      // Afficher le logo

  // Pied de page
  footerText: string;        // Texte du pied de page
  showPageNumbers: boolean;  // Afficher les numéros de page
  showDate: boolean;         // Afficher la date d'impression

  // Signatures
  signatureLeft: string;     // Signature gauche (titre/nom)
  signatureRight: string;    // Signature droite (titre/nom)
  signatureCenter: string;   // Signature centre (titre/nom)

  // Format
  orientation: 'portrait' | 'landscape';
  fontSize: 'small' | 'medium' | 'large';
}

/** Configuration générale de l'application */
export interface GeneralConfig {
  // Affichage
  defaultPageSize: number;         // Nombre d'éléments par page par défaut
  showMentions: boolean;           // Afficher les mentions dans les classements
  showRankInScores: boolean;       // Afficher le rang dans le récapitulatif des notes

  // Calculs
  roundingDecimals: number;        // Nombre de décimales pour les moyennes (2 par défaut)
  includeAbsentInStats: boolean;   // Inclure les absents dans les statistiques

  // Exports
  defaultExportFormat: 'pdf' | 'excel';
  includeSchoolLogo: boolean;      // Inclure le logo dans les exports
}

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

const DEFAULT_MENTIONS: MentionThreshold[] = [
  { id: 'excellent', label: 'Excellent', minScore: 18, color: '#7c3aed' },
  { id: 'tres-bien', label: 'Très Bien', minScore: 16, color: '#2563eb' },
  { id: 'bien', label: 'Bien', minScore: 14, color: '#059669' },
  { id: 'assez-bien', label: 'Assez Bien', minScore: 12, color: '#65a30d' },
  { id: 'passable', label: 'Passable', minScore: 10, color: '#ca8a04' },
];

const DEFAULT_DOCUMENT_CONFIG: DocumentConfig = {
  headerTitle: 'République du Cameroun',
  headerSubtitle: 'Ministère des Enseignements Secondaires',
  institutionName: '',
  logoEnabled: true,

  footerText: 'Document généré par G-Exam',
  showPageNumbers: true,
  showDate: true,

  signatureLeft: 'Le Président du Jury',
  signatureRight: 'Le Secrétaire',
  signatureCenter: '',

  orientation: 'landscape',
  fontSize: 'medium',
};

const DEFAULT_GENERAL_CONFIG: GeneralConfig = {
  defaultPageSize: 20,
  showMentions: true,
  showRankInScores: false,

  roundingDecimals: 2,
  includeAbsentInStats: false,

  defaultExportFormat: 'pdf',
  includeSchoolLogo: true,
};

// ============================================
// STORE
// ============================================

interface SettingsState {
  // Données
  mentions: MentionThreshold[];
  documentConfig: DocumentConfig;
  generalConfig: GeneralConfig;

  // Actions - Mentions
  setMentions: (mentions: MentionThreshold[]) => void;
  addMention: (mention: MentionThreshold) => void;
  updateMention: (id: string, data: Partial<MentionThreshold>) => void;
  deleteMention: (id: string) => void;
  resetMentions: () => void;

  // Actions - Document
  setDocumentConfig: (config: Partial<DocumentConfig>) => void;
  resetDocumentConfig: () => void;

  // Actions - General
  setGeneralConfig: (config: Partial<GeneralConfig>) => void;
  resetGeneralConfig: () => void;

  // Actions - Global
  resetAll: () => void;

  // Getters
  getMention: (average: number) => MentionThreshold | null;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      mentions: DEFAULT_MENTIONS,
      documentConfig: DEFAULT_DOCUMENT_CONFIG,
      generalConfig: DEFAULT_GENERAL_CONFIG,

      // ---- Mentions ----
      setMentions: (mentions) => {
        set({ mentions: [...mentions].sort((a, b) => b.minScore - a.minScore) });
      },

      addMention: (mention) => {
        set((state) => ({
          mentions: [...state.mentions, mention].sort((a, b) => b.minScore - a.minScore),
        }));
      },

      updateMention: (id, data) => {
        set((state) => ({
          mentions: state.mentions
            .map((m) => (m.id === id ? { ...m, ...data } : m))
            .sort((a, b) => b.minScore - a.minScore),
        }));
      },

      deleteMention: (id) => {
        set((state) => ({
          mentions: state.mentions.filter((m) => m.id !== id),
        }));
      },

      resetMentions: () => {
        set({ mentions: DEFAULT_MENTIONS });
      },

      // ---- Document ----
      setDocumentConfig: (config) => {
        set((state) => ({
          documentConfig: { ...state.documentConfig, ...config },
        }));
      },

      resetDocumentConfig: () => {
        set({ documentConfig: DEFAULT_DOCUMENT_CONFIG });
      },

      // ---- General ----
      setGeneralConfig: (config) => {
        set((state) => ({
          generalConfig: { ...state.generalConfig, ...config },
        }));
      },

      resetGeneralConfig: () => {
        set({ generalConfig: DEFAULT_GENERAL_CONFIG });
      },

      // ---- Global ----
      resetAll: () => {
        set({
          mentions: DEFAULT_MENTIONS,
          documentConfig: DEFAULT_DOCUMENT_CONFIG,
          generalConfig: DEFAULT_GENERAL_CONFIG,
        });
      },

      // ---- Getters ----
      getMention: (average: number) => {
        const { mentions, generalConfig } = get();
        if (!generalConfig.showMentions) return null;
        // Mentions are sorted by minScore descending
        return mentions.find((m) => average >= m.minScore) ?? null;
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
