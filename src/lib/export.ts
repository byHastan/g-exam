/**
 * Module d'export des données d'examen
 *
 * Gère l'export en PDF et Excel pour:
 * - Liste des résultats (classement)
 * - Procès-verbal de délibération
 * - Statistiques par établissement
 * - Notes détaillées par épreuve
 *
 * Supporte le mode web et le mode Tauri/desktop
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ============================================
// DÉTECTION TAURI
// ============================================

/**
 * Vérifie si l'application tourne en mode Tauri (desktop)
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ============================================
// TYPES
// ============================================

/**
 * Informations de l'examen pour l'en-tête des exports
 */
export interface ExamInfo {
  name: string;
  year: number;
  passingGrade: number;
  maxGrade: number;
  /** Nombre de candidats présents (optionnel) */
  totalPresent?: number;
  /** Nombre de candidats absents (optionnel) */
  totalAbsent?: number;
}

/**
 * Données d'un élève pour l'export
 */
export interface ExportStudent {
  candidateNumber: string;
  lastName: string;
  firstName: string;
  gender: string | null;
  schoolName: string;
  scores: Record<string, number | null>; // subjectId -> note
  average: number | null;
  rank: number | null;
  status: "admitted" | "failed" | "pending" | "absent";
}

/**
 * Statistiques d'un établissement
 */
export interface SchoolStats {
  schoolName: string;
  totalCandidates: number;
  admitted: number;
  failed: number;
  successRate: number;
  averageGrade: number;
}

/**
 * Statistiques d'une épreuve
 */
export interface SubjectStats {
  subjectName: string;
  coefficient: number | null;
  totalScores: number;
  average: number;
  minScore: number;
  maxScore: number;
}

/**
 * Données d'un élève dans une salle
 */
export interface RoomStudent {
  id: string;
  /** N° Candidat basé sur l'ordre alphabétique (ex: 0001) */
  candidateNumber?: string;
  lastName: string;
  firstName: string;
  schoolName?: string;
}

/**
 * Formate un N° Candidat en 4 chiffres (ex: 0001)
 */
function formatCandidateNumber(index: number): string {
  return String(index + 1).padStart(4, "0");
}

/**
 * Données d'une salle pour l'export
 */
export interface ExportRoom {
  roomNumber: number;
  roomName?: string;
  capacity: number;
  students: RoomStudent[];
}

/**
 * Options d'export
 */
export interface ExportOptions {
  includeScores?: boolean; // Inclure les notes détaillées
  includeRank?: boolean; // Inclure le classement
  filterStatus?: "all" | "admitted" | "failed" | "absent";
  sortBy?: "rank" | "name" | "school";
}

/**
 * Configuration de personnalisation des documents (provient de settingsStore)
 */
export interface DocumentExportConfig {
  headerTitle?: string;
  headerSubtitle?: string;
  institutionName?: string;
  logoEnabled?: boolean;
  footerText?: string;
  showPageNumbers?: boolean;
  showDate?: boolean;
  signatureLeft?: string;
  signatureRight?: string;
  signatureCenter?: string;
  orientation?: "portrait" | "landscape";
  fontSize?: "small" | "medium" | "large";
}

/**
 * Données pour le procès-verbal de l'examen
 */
export interface ProcesVerbalData {
  examName: string;
  examYear: number;
  centreName?: string; // Ex: "CENTRE E COMPOSITION EPL. Etoile Polaire"
  /** Nombre d'inscrits */
  totalInscrits: number;
  /** Nombre de présents */
  totalPresent: number;
  /** Nombre d'absents */
  totalAbsent: number;
  /** Nombre d'admis */
  admitted: number;
  /** Nombre d'ajournés */
  failed: number;
  /** Taux de réussite (0-100) */
  successRate: number;
  /** Taux d'échec (0-100) */
  failureRate: number;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate une date pour l'affichage
 */
function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formate une note pour l'affichage
 */
function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "-";
  return score.toFixed(2);
}

/**
 * Obtient le statut d'admission en français
 */
function getStatusLabel(
  status: "admitted" | "failed" | "pending" | "absent",
): string {
  switch (status) {
    case "admitted":
      return "Admis";
    case "failed":
      return "Ajourné";
    case "pending":
      return "En attente";
    case "absent":
      return "Absent";
  }
}

// ============================================
// EXPORT EXCEL
// ============================================

/**
 * Crée un workbook Excel avec les résultats des élèves
 */
function createResultsWorkbook(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  options: ExportOptions = {},
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Préparer les données
  const headers: string[] = [
    "N° Candidat",
    "Nom",
    "Prénom",
    "Sexe",
    "Établissement",
  ];

  if (options.includeScores) {
    subjects.forEach((s) => {
      const coefLabel = s.coefficient ? ` (coef ${s.coefficient})` : "";
      headers.push(`${s.name}${coefLabel}`);
    });
  }

  headers.push("Moyenne");

  if (options.includeRank) {
    headers.push("Rang");
  }

  headers.push("Décision");

  // Filtrer et trier les élèves
  let filteredStudents = [...students];

  if (options.filterStatus && options.filterStatus !== "all") {
    filteredStudents = filteredStudents.filter(
      (s) => s.status === options.filterStatus,
    );
  }

  switch (options.sortBy) {
    case "rank":
      filteredStudents.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
      break;
    case "name":
      filteredStudents.sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );
      break;
    case "school":
      filteredStudents.sort(
        (a, b) =>
          a.schoolName.localeCompare(b.schoolName) ||
          (a.rank ?? 9999) - (b.rank ?? 9999),
      );
      break;
  }

  // Construire les lignes de données
  const rows: (string | number)[][] = [];

  for (const student of filteredStudents) {
    const row: (string | number)[] = [
      student.candidateNumber,
      student.lastName,
      student.firstName,
      student.gender || "-",
      student.schoolName,
    ];

    if (options.includeScores) {
      subjects.forEach((s) => {
        const score = student.scores[s.id];
        row.push(score !== null && score !== undefined ? score : "-");
      });
    }

    row.push(student.average !== null ? student.average : "-");

    if (options.includeRank) {
      row.push(student.rank ?? "-");
    }

    row.push(getStatusLabel(student.status));

    rows.push(row);
  }

  // Créer la feuille avec en-tête d'examen
  const wsData: (string | number)[][] = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    [`Date d'export: ${formatDate()}`],
    [`Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`],
  ];

  // Ajouter les compteurs présents/absents si disponibles
  if (
    examInfo.totalPresent !== undefined ||
    examInfo.totalAbsent !== undefined
  ) {
    wsData.push([
      `Présents: ${examInfo.totalPresent ?? 0} | Absents: ${examInfo.totalAbsent ?? 0}`,
    ]);
  }

  wsData.push([], headers, ...rows);

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Définir les largeurs de colonnes
  const colWidths = [
    { wch: 15 }, // N° Candidat
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 8 }, // Sexe
    { wch: 25 }, // Établissement
  ];

  if (options.includeScores) {
    subjects.forEach(() => colWidths.push({ wch: 12 }));
  }

  colWidths.push({ wch: 10 }); // Moyenne

  if (options.includeRank) {
    colWidths.push({ wch: 8 }); // Rang
  }

  colWidths.push({ wch: 12 }); // Décision

  worksheet["!cols"] = colWidths;

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats");

  return workbook;
}

/**
 * Crée un workbook Excel avec les résultats d'un établissement spécifique
 */
function createSchoolResultsWorkbook(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  schoolName: string,
  options: ExportOptions = {},
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Préparer les données (sans colonne établissement car tous du même)
  const headers: string[] = ["N° Candidat", "Nom", "Prénom", "Sexe"];

  if (options.includeScores) {
    subjects.forEach((s) => {
      const coefLabel = s.coefficient ? ` (coef ${s.coefficient})` : "";
      headers.push(`${s.name}${coefLabel}`);
    });
  }

  headers.push("Moyenne");

  if (options.includeRank) {
    headers.push("Rang");
  }

  headers.push("Décision");

  // Filtrer et trier les élèves
  let filteredStudents = [...students];

  if (options.filterStatus && options.filterStatus !== "all") {
    filteredStudents = filteredStudents.filter(
      (s) => s.status === options.filterStatus,
    );
  }

  switch (options.sortBy) {
    case "rank":
      filteredStudents.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
      break;
    case "name":
      filteredStudents.sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );
      break;
  }

  // Construire les lignes de données
  const rows: (string | number)[][] = [];

  for (const student of filteredStudents) {
    const row: (string | number)[] = [
      student.candidateNumber,
      student.lastName,
      student.firstName,
      student.gender || "-",
    ];

    if (options.includeScores) {
      subjects.forEach((s) => {
        const score = student.scores[s.id];
        row.push(score !== null && score !== undefined ? score : "-");
      });
    }

    row.push(student.average !== null ? student.average : "-");

    if (options.includeRank) {
      row.push(student.rank ?? "-");
    }

    row.push(getStatusLabel(student.status));

    rows.push(row);
  }

  // Statistiques de l'établissement
  const admitted = filteredStudents.filter(
    (s) => s.status === "admitted",
  ).length;
  const failed = filteredStudents.filter((s) => s.status === "failed").length;
  const successRate =
    filteredStudents.length > 0
      ? Math.round((admitted / filteredStudents.length) * 100)
      : 0;

  // Créer la feuille avec en-tête d'examen
  const wsData = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    [`Établissement: ${schoolName}`],
    [`Date d'export: ${formatDate()}`],
    [`Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`],
    [
      `Candidats: ${filteredStudents.length} | Admis: ${admitted} | Ajournés: ${failed} | Taux: ${successRate}%`,
    ],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Définir les largeurs de colonnes
  const colWidths = [
    { wch: 15 }, // N° Candidat
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 8 }, // Sexe
  ];

  if (options.includeScores) {
    subjects.forEach(() => colWidths.push({ wch: 12 }));
  }

  colWidths.push({ wch: 10 }); // Moyenne

  if (options.includeRank) {
    colWidths.push({ wch: 8 }); // Rang
  }

  colWidths.push({ wch: 12 }); // Décision

  worksheet["!cols"] = colWidths;

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats");

  return workbook;
}

/**
 * Crée un workbook Excel avec les statistiques par établissement
 */
function createSchoolStatsWorkbook(
  examInfo: ExamInfo,
  schoolStats: SchoolStats[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const headers = [
    "Établissement",
    "Candidats",
    "Admis",
    "Ajournés",
    "Taux de réussite (%)",
    "Moyenne générale",
  ];

  // Trier par taux de réussite décroissant
  const sortedStats = [...schoolStats].sort(
    (a, b) => b.successRate - a.successRate,
  );

  const rows = sortedStats.map((stat) => [
    stat.schoolName,
    stat.totalCandidates,
    stat.admitted,
    stat.failed,
    stat.successRate,
    stat.averageGrade.toFixed(2),
  ]);

  // Ajouter le total
  const totals = {
    candidates: sortedStats.reduce((sum, s) => sum + s.totalCandidates, 0),
    admitted: sortedStats.reduce((sum, s) => sum + s.admitted, 0),
    failed: sortedStats.reduce((sum, s) => sum + s.failed, 0),
  };

  rows.push([
    "TOTAL",
    totals.candidates,
    totals.admitted,
    totals.failed,
    totals.candidates > 0
      ? Math.round((totals.admitted / totals.candidates) * 100)
      : 0,
    "-",
  ]);

  const wsData = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    ["Statistiques par établissement"],
    [`Date d'export: ${formatDate()}`],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Stats Établissements");

  return workbook;
}

/**
 * Crée un workbook Excel avec les statistiques par épreuve
 */
function createSubjectStatsWorkbook(
  examInfo: ExamInfo,
  subjectStats: SubjectStats[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const headers = [
    "Épreuve",
    "Coefficient",
    "Copies corrigées",
    "Moyenne",
    "Note min",
    "Note max",
  ];

  const rows = subjectStats.map((stat) => [
    stat.subjectName,
    stat.coefficient ?? "-",
    stat.totalScores,
    stat.average.toFixed(2),
    stat.minScore.toFixed(2),
    stat.maxScore.toFixed(2),
  ]);

  const wsData = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    ["Statistiques par épreuve"],
    [`Date d'export: ${formatDate()}`],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Stats Épreuves");

  return workbook;
}

// ============================================
// EXPORT PDF
// ============================================

/**
 * Configure un document PDF avec les styles par défaut
 */
function createPdfDocument(
  orientation: "portrait" | "landscape" = "portrait",
  config?: DocumentExportConfig,
): jsPDF {
  const finalOrientation = config?.orientation || orientation;
  return new jsPDF({
    orientation: finalOrientation,
    unit: "mm",
    format: "a4",
  });
}

/** Résout la taille de police selon la config */
function resolveFontSize(config?: DocumentExportConfig): { table: number; header: number; subheader: number; body: number } {
  switch (config?.fontSize) {
    case "small":  return { table: 7, header: 14, subheader: 10, body: 8 };
    case "large":  return { table: 10, header: 18, subheader: 13, body: 11 };
    default:       return { table: 8, header: 16, subheader: 12, body: 10 };
  }
}

/**
 * Ajoute les signatures et le pied de page au document PDF
 */
function addPdfFooter(doc: jsPDF, config?: DocumentExportConfig): void {
  if (!config) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Signatures (30mm au-dessus du bas)
    const sigY = pageHeight - 35;
    const hasAnySig = config.signatureLeft || config.signatureCenter || config.signatureRight;

    if (hasAnySig) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      if (config.signatureLeft) {
        doc.text(config.signatureLeft, 20, sigY);
        doc.line(15, sigY + 15, 65, sigY + 15); // Ligne de signature
      }
      if (config.signatureCenter) {
        doc.text(config.signatureCenter, pageWidth / 2, sigY, { align: "center" });
        doc.line(pageWidth / 2 - 25, sigY + 15, pageWidth / 2 + 25, sigY + 15);
      }
      if (config.signatureRight) {
        doc.text(config.signatureRight, pageWidth - 20, sigY, { align: "right" });
        doc.line(pageWidth - 65, sigY + 15, pageWidth - 15, sigY + 15);
      }
    }

    // Pied de page (10mm du bas)
    const footerY = pageHeight - 10;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);

    if (config.footerText) {
      doc.text(config.footerText, 14, footerY);
    }

    const rightParts: string[] = [];
    if (config.showDate) {
      rightParts.push(formatDate());
    }
    if (config.showPageNumbers) {
      rightParts.push(`Page ${i}/${totalPages}`);
    }
    if (rightParts.length > 0) {
      doc.text(rightParts.join("  |  "), pageWidth - 14, footerY, { align: "right" });
    }

    doc.setTextColor(0, 0, 0); // Reset
  }
}

/**
 * Ajoute l'en-tête d'examen au document PDF
 */
function addPdfHeader(doc: jsPDF, examInfo: ExamInfo, title: string, config?: DocumentExportConfig): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const fs = resolveFontSize(config);
  let yPos = 15;

  // En-tête institutionnel (depuis les paramètres)
  if (config?.headerTitle) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.headerTitle.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerSubtitle) {
    doc.setFontSize(fs.body - 1);
    doc.setFont("helvetica", "normal");
    doc.text(config.headerSubtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.institutionName) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.institutionName, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  if (config?.headerTitle || config?.headerSubtitle || config?.institutionName) {
    yPos += 3; // Espace après en-tête institutionnel
  }

  // Titre de l'examen
  doc.setFontSize(fs.header);
  doc.setFont("helvetica", "bold");
  doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 8;

  // Sous-titre
  doc.setFontSize(fs.subheader);
  doc.text(title, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Informations
  doc.setFontSize(fs.body);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'export: ${formatDate()}`, 14, yPos);
  yPos += 6;
  doc.text(
    `Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`,
    14,
    yPos,
  );
  yPos += 6;

  // Ajouter les compteurs présents/absents si disponibles
  if (
    examInfo.totalPresent !== undefined ||
    examInfo.totalAbsent !== undefined
  ) {
    doc.text(
      `Présents: ${examInfo.totalPresent ?? 0} | Absents: ${examInfo.totalAbsent ?? 0}`,
      14,
      yPos,
    );
    yPos += 6;
  }

  return yPos; // Y position après l'en-tête
}

/**
 * Crée un PDF avec les résultats des élèves
 */
function createResultsPdf(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  options: ExportOptions = {},
  config?: DocumentExportConfig,
): jsPDF {
  // Utiliser l'orientation paysage si beaucoup de colonnes
  const useScores = options.includeScores && subjects.length > 0;
  const orientation =
    useScores && subjects.length > 4 ? "landscape" : "portrait";
  const fs = resolveFontSize(config);

  const doc = createPdfDocument(orientation, config);
  const startY = addPdfHeader(doc, examInfo, "Procès-verbal de délibération", config);

  // Préparer les colonnes
  const columns: string[] = ["N°", "Nom", "Prénom", "Établissement"];

  if (useScores) {
    subjects.forEach((s) => {
      columns.push(s.name.substring(0, 10)); // Tronquer le nom pour l'espace
    });
  }

  columns.push("Moy.");

  if (options.includeRank) {
    columns.push("Rg");
  }

  columns.push("Décision");

  // Filtrer et trier
  let filteredStudents = [...students];

  if (options.filterStatus && options.filterStatus !== "all") {
    filteredStudents = filteredStudents.filter(
      (s) => s.status === options.filterStatus,
    );
  }

  switch (options.sortBy) {
    case "rank":
      filteredStudents.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
      break;
    case "name":
      filteredStudents.sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );
      break;
    case "school":
      filteredStudents.sort(
        (a, b) =>
          a.schoolName.localeCompare(b.schoolName) ||
          (a.rank ?? 9999) - (b.rank ?? 9999),
      );
      break;
  }

  // Construire les lignes
  const rows = filteredStudents.map((student) => {
    const row: string[] = [
      student.candidateNumber,
      student.lastName,
      student.firstName,
      student.schoolName.substring(0, 15),
    ];

    if (useScores) {
      subjects.forEach((s) => {
        row.push(formatScore(student.scores[s.id]));
      });
    }

    row.push(formatScore(student.average));

    if (options.includeRank) {
      row.push(student.rank?.toString() ?? "-");
    }

    row.push(getStatusLabel(student.status));

    return row;
  });

  // Générer le tableau
  autoTable(doc, {
    startY,
    head: [columns],
    body: rows,
    styles: {
      fontSize: fs.table,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Colorer la décision selon le statut
      if (data.column.index === columns.length - 1 && data.section === "body") {
        const status = data.cell.raw as string;
        if (status === "Admis") {
          data.cell.styles.textColor = [34, 197, 94]; // green-500
          data.cell.styles.fontStyle = "bold";
        } else if (status === "Ajourné") {
          data.cell.styles.textColor = [239, 68, 68]; // red-500
        } else if (status === "Absent") {
          data.cell.styles.textColor = [234, 88, 12]; // orange-600
        }
      }
    },
  });

  // Ajouter le résumé en bas
  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;
  const admitted = filteredStudents.filter(
    (s) => s.status === "admitted",
  ).length;
  const failed = filteredStudents.filter((s) => s.status === "failed").length;

  doc.setFontSize(fs.body);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total: ${filteredStudents.length} candidats | Admis: ${admitted} | Ajournés: ${failed}`,
    14,
    finalY,
  );

  addPdfFooter(doc, config);

  return doc;
}

/**
 * Crée un PDF avec les résultats d'un établissement spécifique
 */
function createSchoolResultsPdf(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  schoolName: string,
  options: ExportOptions = {},
  config?: DocumentExportConfig,
): jsPDF {
  // Utiliser l'orientation paysage si beaucoup de colonnes
  const useScores = options.includeScores && subjects.length > 0;
  const orientation =
    useScores && subjects.length > 4 ? "landscape" : "portrait";
  const fs = resolveFontSize(config);

  const doc = createPdfDocument(orientation, config);
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // En-tête institutionnel (depuis les paramètres)
  if (config?.headerTitle) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.headerTitle.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerSubtitle) {
    doc.setFontSize(fs.body - 1);
    doc.setFont("helvetica", "normal");
    doc.text(config.headerSubtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.institutionName) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.institutionName, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerTitle || config?.headerSubtitle || config?.institutionName) {
    yPos += 3;
  }

  // En-tête personnalisé pour l'établissement
  doc.setFontSize(fs.header);
  doc.setFont("helvetica", "bold");
  doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 8;

  doc.setFontSize(fs.subheader + 2);
  doc.text(schoolName, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(fs.body);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'export: ${formatDate()}`, 14, yPos);
  yPos += 6;
  doc.text(
    `Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`,
    14,
    yPos,
  );
  yPos += 6;

  const startY = yPos;

  // Préparer les colonnes (sans établissement)
  const columns: string[] = ["N°", "Nom", "Prénom"];

  if (useScores) {
    subjects.forEach((s) => {
      columns.push(s.name.substring(0, 10));
    });
  }

  columns.push("Moy.");

  if (options.includeRank) {
    columns.push("Rg");
  }

  columns.push("Décision");

  // Filtrer et trier
  let filteredStudents = [...students];

  if (options.filterStatus && options.filterStatus !== "all") {
    filteredStudents = filteredStudents.filter(
      (s) => s.status === options.filterStatus,
    );
  }

  switch (options.sortBy) {
    case "rank":
      filteredStudents.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
      break;
    case "name":
      filteredStudents.sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      );
      break;
  }

  // Construire les lignes
  const rows = filteredStudents.map((student) => {
    const row: string[] = [
      student.candidateNumber,
      student.lastName,
      student.firstName,
    ];

    if (useScores) {
      subjects.forEach((s) => {
        row.push(formatScore(student.scores[s.id]));
      });
    }

    row.push(formatScore(student.average));

    if (options.includeRank) {
      row.push(student.rank?.toString() ?? "-");
    }

    row.push(getStatusLabel(student.status));

    return row;
  });

  // Générer le tableau
  autoTable(doc, {
    startY,
    head: [columns],
    body: rows,
    styles: {
      fontSize: fs.table,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 20 },
    },
    didParseCell: (data) => {
      if (data.column.index === columns.length - 1 && data.section === "body") {
        const status = data.cell.raw as string;
        if (status === "Admis") {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = "bold";
        } else if (status === "Ajourné") {
          data.cell.styles.textColor = [239, 68, 68];
        } else if (status === "Absent") {
          data.cell.styles.textColor = [234, 88, 12];
        }
      }
    },
  });

  // Ajouter le résumé en bas
  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;
  const admitted = filteredStudents.filter(
    (s) => s.status === "admitted",
  ).length;
  const failed = filteredStudents.filter((s) => s.status === "failed").length;
  const successRate =
    filteredStudents.length > 0
      ? Math.round((admitted / filteredStudents.length) * 100)
      : 0;

  doc.setFontSize(fs.body);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total: ${filteredStudents.length} candidats | Admis: ${admitted} | Ajournés: ${failed} | Taux de réussite: ${successRate}%`,
    14,
    finalY,
  );

  addPdfFooter(doc, config);

  return doc;
}

/**
 * Crée un PDF avec les statistiques par établissement
 */
function createSchoolStatsPdf(
  examInfo: ExamInfo,
  schoolStats: SchoolStats[],
  config?: DocumentExportConfig,
): jsPDF {
  const doc = createPdfDocument("portrait", config);
  const startY = addPdfHeader(doc, examInfo, "Statistiques par établissement", config);
  const fs = resolveFontSize(config);

  const sortedStats = [...schoolStats].sort(
    (a, b) => b.successRate - a.successRate,
  );

  const columns = [
    "Établissement",
    "Candidats",
    "Admis",
    "Ajournés",
    "Taux (%)",
    "Moyenne",
  ];

  const rows = sortedStats.map((stat) => [
    stat.schoolName,
    stat.totalCandidates.toString(),
    stat.admitted.toString(),
    stat.failed.toString(),
    `${stat.successRate}%`,
    stat.averageGrade.toFixed(2),
  ]);

  // Ajouter le total
  const totals = {
    candidates: sortedStats.reduce((sum, s) => sum + s.totalCandidates, 0),
    admitted: sortedStats.reduce((sum, s) => sum + s.admitted, 0),
    failed: sortedStats.reduce((sum, s) => sum + s.failed, 0),
  };

  rows.push([
    "TOTAL",
    totals.candidates.toString(),
    totals.admitted.toString(),
    totals.failed.toString(),
    totals.candidates > 0
      ? `${Math.round((totals.admitted / totals.candidates) * 100)}%`
      : "0%",
    "-",
  ]);

  autoTable(doc, {
    startY,
    head: [columns],
    body: rows,
    styles: {
      fontSize: fs.body,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didParseCell: (data) => {
      // Style pour la ligne total
      if (data.row.index === rows.length - 1 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [229, 231, 235];
      }
    },
  });

  addPdfFooter(doc, config);

  return doc;
}

/**
 * Crée un PDF avec les statistiques par épreuve
 */
function createSubjectStatsPdf(
  examInfo: ExamInfo,
  subjectStats: SubjectStats[],
  config?: DocumentExportConfig,
): jsPDF {
  const doc = createPdfDocument("portrait", config);
  const startY = addPdfHeader(doc, examInfo, "Statistiques par épreuve", config);
  const fs = resolveFontSize(config);

  const columns = ["Épreuve", "Coefficient", "Copies", "Moyenne", "Min", "Max"];

  const rows = subjectStats.map((stat) => [
    stat.subjectName,
    stat.coefficient?.toString() ?? "-",
    stat.totalScores.toString(),
    stat.average.toFixed(2),
    stat.minScore.toFixed(2),
    stat.maxScore.toFixed(2),
  ]);

  autoTable(doc, {
    startY,
    head: [columns],
    body: rows,
    styles: {
      fontSize: fs.body,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  addPdfFooter(doc, config);

  return doc;
}

/**
 * Crée un PDF du procès-verbal de l'examen
 * Reproduit fidèlement le modèle Proces_verbal.md
 */
function createProcesVerbalPdf(data: ProcesVerbalData, config?: DocumentExportConfig): jsPDF {
  const doc = createPdfDocument("portrait", config);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fs = resolveFontSize(config);

  // Formater la date du jour
  const now = new Date();
  const joursSemaine = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const mois = [
    "JANVIER",
    "FEVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOUT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DECEMBRE",
  ];
  const jourSemaine = joursSemaine[now.getDay()];
  const jour = now.getDate();
  const moisNom = mois[now.getMonth()];
  const annee = now.getFullYear();
  const dateFormatted = `${jourSemaine} ${jour} ${moisNom} ${annee}`;

  let yPos = 20;

  // En-tête institutionnel (depuis les paramètres)
  if (config?.headerTitle) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.headerTitle.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerSubtitle) {
    doc.setFontSize(fs.body - 1);
    doc.setFont("helvetica", "normal");
    doc.text(config.headerSubtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.institutionName) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.institutionName, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerTitle || config?.headerSubtitle || config?.institutionName) {
    yPos += 5;
  }

  // Titre principal (centré, gras)
  doc.setFontSize(fs.header - 2);
  doc.setFont("helvetica", "bold");
  doc.text(
    `PROCES VERBAL DE L'EXAMEN ${data.examName.toUpperCase()} N°1`,
    pageWidth / 2,
    yPos,
    { align: "center" },
  );
  yPos += 15;

  // Ligne vide puis centre de composition
  doc.setFontSize(fs.subheader - 1);
  doc.setFont("helvetica", "normal");
  const centreLine = data.centreName
    ? `CENTRE DE COMPOSITION ${data.centreName}`
    : "CENTRE DE COMPOSITION";
  doc.text(centreLine, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Paragraphe de contexte avec pointillés
  doc.setFontSize(fs.body);
  const contextText =
    `Ce ${dateFormatted}, le Groupe pédagogique CEP BLANC SECTORIEL organise son premier Examen blanc. ` +
    `Celui-ci a démarré à ……………… par l'épreuve de…………………………….. . ` +
    `Par la suite, nous avons poursuivi avec l'épreuve……………………………... ……….. ` +
    `Aussi, à……………...…, nous avons eu une pause de…….……………………. ` +
    `Pour enfin terminer l'Examen blanc par l'épreuve d'………….…………..qui s'acheva à…………. .`;

  doc.text(contextText, 14, yPos, {
    maxWidth: pageWidth - 28,
    lineHeightFactor: 1.5,
  });
  yPos += 35;

  // "Nous avons enregistré X candidats, dont :"
  doc.text(
    `Nous avons enregistré ${data.totalInscrits} candidats, dont :`,
    14,
    yPos,
  );
  yPos += 10;

  // Liste à puces
  const bulletY = yPos;
  const lineHeight = 7;
  const bulletLines = [
    `• Inscrits : ${data.totalInscrits} élèves.`,
    `• Présents : ${data.totalPresent} élèves.`,
    `• Absents : ${data.totalAbsent} élèves.`,
    `• Admis : ${data.admitted} élèves.`,
    `• Ajournés : ${data.failed} élèves.`,
  ];

  bulletLines.forEach((line, i) => {
    doc.text(line, 14, bulletY + i * lineHeight);
  });

  // Signatures personnalisées ou par défaut
  if (config?.signatureLeft || config?.signatureCenter || config?.signatureRight) {
    addPdfFooter(doc, config);
  } else {
    doc.setFontSize(fs.body);
    doc.text("La présidente du centre:", pageWidth - 14, pageHeight - 40, {
      align: "right",
    });
    // Pied de page basique si config
    if (config?.footerText || config?.showPageNumbers || config?.showDate) {
      addPdfFooter(doc, config);
    }
  }

  return doc;
}

// ============================================
// FONCTIONS D'EXPORT PRINCIPALES
// ============================================

/**
 * Télécharge un fichier Excel en mode web
 */
function downloadExcelWeb(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename);
}

/**
 * Télécharge un fichier Excel en mode Tauri
 */
async function downloadExcelTauri(
  workbook: XLSX.WorkBook,
  filename: string,
): Promise<void> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");

  const filePath = await save({
    defaultPath: filename,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
    title: "Enregistrer le fichier Excel",
  });

  if (!filePath) return;

  const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  await writeFile(filePath, new Uint8Array(excelBuffer));
}

/**
 * Télécharge un fichier PDF en mode web
 */
function downloadPdfWeb(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Télécharge un fichier PDF en mode Tauri
 */
async function downloadPdfTauri(doc: jsPDF, filename: string): Promise<void> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");

  const filePath = await save({
    defaultPath: filename,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    title: "Enregistrer le fichier PDF",
  });

  if (!filePath) return;

  const pdfBuffer = doc.output("arraybuffer");
  await writeFile(filePath, new Uint8Array(pdfBuffer));
}

// ============================================
// API PUBLIQUE
// ============================================

/**
 * Exporte les résultats des élèves en Excel
 */
export async function exportResultsToExcel(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  options: ExportOptions = {},
): Promise<void> {
  const workbook = createResultsWorkbook(examInfo, students, subjects, options);
  const filename = `resultats_${examInfo.name.replace(/\s+/g, "_")}_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

/**
 * Exporte les résultats des élèves en PDF
 */
export async function exportResultsToPdf(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  options: ExportOptions = {},
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createResultsPdf(examInfo, students, subjects, options, config);
  const filename = `resultats_${examInfo.name.replace(/\s+/g, "_")}_${examInfo.year}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Exporte les statistiques par établissement en Excel
 */
export async function exportSchoolStatsToExcel(
  examInfo: ExamInfo,
  schoolStats: SchoolStats[],
): Promise<void> {
  const workbook = createSchoolStatsWorkbook(examInfo, schoolStats);
  const filename = `stats_etablissements_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

/**
 * Exporte les statistiques par établissement en PDF
 */
export async function exportSchoolStatsToPdf(
  examInfo: ExamInfo,
  schoolStats: SchoolStats[],
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createSchoolStatsPdf(examInfo, schoolStats, config);
  const filename = `stats_etablissements_${examInfo.year}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Exporte les statistiques par épreuve en Excel
 */
export async function exportSubjectStatsToExcel(
  examInfo: ExamInfo,
  subjectStats: SubjectStats[],
): Promise<void> {
  const workbook = createSubjectStatsWorkbook(examInfo, subjectStats);
  const filename = `stats_epreuves_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

/**
 * Exporte les statistiques par épreuve en PDF
 */
export async function exportSubjectStatsToPdf(
  examInfo: ExamInfo,
  subjectStats: SubjectStats[],
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createSubjectStatsPdf(examInfo, subjectStats, config);
  const filename = `stats_epreuves_${examInfo.year}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Exporte le procès-verbal de l'examen en PDF
 * Contient : inscrits, présents, absents, admis, ajournés, taux de réussite, taux d'échec
 */
export async function exportProcesVerbalToPdf(
  data: ProcesVerbalData,
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createProcesVerbalPdf(data, config);
  const filename = `proces_verbal_${data.examName.replace(/\s+/g, "_")}_${data.examYear}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Exporte les résultats d'un établissement spécifique en Excel
 * Recalcule le rang interne à l'établissement
 */
export async function exportSchoolResultsToExcel(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  schoolName: string,
  options: ExportOptions = {},
): Promise<void> {
  // Filtrer les élèves de l'établissement
  const schoolStudents = students.filter((s) => s.schoolName === schoolName);

  // Recalculer le rang interne à l'établissement
  const sortedStudents = [...schoolStudents].sort(
    (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999),
  );
  const studentsWithSchoolRank = sortedStudents.map((student, index) => ({
    ...student,
    rank: index + 1, // Rang interne à l'établissement
  }));

  // Créer le workbook avec l'en-tête spécifique
  const workbook = createSchoolResultsWorkbook(
    examInfo,
    studentsWithSchoolRank,
    subjects,
    schoolName,
    options,
  );

  const sanitizedName = schoolName
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, "")
    .replace(/\s+/g, "_");
  const filename = `resultats_${sanitizedName}_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

/**
 * Exporte les résultats d'un établissement spécifique en PDF
 * Recalcule le rang interne à l'établissement
 */
export async function exportSchoolResultsToPdf(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  schoolName: string,
  options: ExportOptions = {},
  config?: DocumentExportConfig,
): Promise<void> {
  // Filtrer les élèves de l'établissement
  const schoolStudents = students.filter((s) => s.schoolName === schoolName);

  // Recalculer le rang interne à l'établissement
  const sortedStudents = [...schoolStudents].sort(
    (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999),
  );
  const studentsWithSchoolRank = sortedStudents.map((student, index) => ({
    ...student,
    rank: index + 1, // Rang interne à l'établissement
  }));

  const doc = createSchoolResultsPdf(
    examInfo,
    studentsWithSchoolRank,
    subjects,
    schoolName,
    options,
    config,
  );

  const sanitizedName = schoolName
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, "")
    .replace(/\s+/g, "_");
  const filename = `resultats_${sanitizedName}_${examInfo.year}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Exporte un rapport complet (toutes les données) en Excel
 * Crée un fichier avec plusieurs feuilles
 */
export async function exportFullReportToExcel(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  schoolStats: SchoolStats[],
  subjectStats: SubjectStats[],
): Promise<void> {
  // Créer le workbook de résultats comme base
  const workbook = createResultsWorkbook(examInfo, students, subjects, {
    includeScores: true,
    includeRank: true,
    sortBy: "rank",
  });

  // Ajouter la feuille des stats établissements
  const schoolWorkbook = createSchoolStatsWorkbook(examInfo, schoolStats);
  const schoolSheet = schoolWorkbook.Sheets["Stats Établissements"];
  XLSX.utils.book_append_sheet(workbook, schoolSheet, "Stats Établissements");

  // Ajouter la feuille des stats épreuves
  const subjectWorkbook = createSubjectStatsWorkbook(examInfo, subjectStats);
  const subjectSheet = subjectWorkbook.Sheets["Stats Épreuves"];
  XLSX.utils.book_append_sheet(workbook, subjectSheet, "Stats Épreuves");

  const filename = `rapport_complet_${examInfo.name.replace(/\s+/g, "_")}_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

// ============================================
// EXPORT SALLES
// ============================================

/**
 * Crée un workbook Excel pour une salle spécifique
 */
function createRoomWorkbook(
  examInfo: ExamInfo,
  room: ExportRoom,
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const headers = ["N° Candidat", "Nom", "Prénom", "Établissement"];

  const rows = room.students.map((student, index) => [
    student.candidateNumber || formatCandidateNumber(index),
    student.lastName,
    student.firstName,
    student.schoolName || "-",
  ]);

  const wsData = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    [`Salle ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ""}`],
    [`Effectif: ${room.students.length} / ${room.capacity} places`],
    [`Date d'export: ${formatDate()}`],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  worksheet["!cols"] = [
    { wch: 12 }, // N° Candidat
    { wch: 25 }, // Nom
    { wch: 25 }, // Prénom
    { wch: 30 }, // Établissement
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Salle ${room.roomNumber}`);

  return workbook;
}

/**
 * Crée un workbook Excel avec toutes les salles (une feuille par salle)
 */
function createAllRoomsWorkbook(
  examInfo: ExamInfo,
  rooms: ExportRoom[],
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Feuille récapitulative
  const summaryHeaders = ["Salle", "Effectif", "Capacité", "Occupation"];
  const summaryRows = rooms
    .filter((r) => r.students.length > 0)
    .map((room) => [
      `Salle ${room.roomNumber}`,
      room.students.length,
      room.capacity,
      `${Math.round((room.students.length / room.capacity) * 100)}%`,
    ]);

  const totalStudents = rooms.reduce((sum, r) => sum + r.students.length, 0);
  summaryRows.push(["TOTAL", totalStudents, "-", "-"]);

  const summaryData = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    ["Récapitulatif des salles"],
    [`Date d'export: ${formatDate()}`],
    [],
    summaryHeaders,
    ...summaryRows,
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Récapitulatif");

  // Une feuille par salle
  const filledRooms = rooms.filter((r) => r.students.length > 0);

  for (const room of filledRooms) {
    const headers = ["N° Candidat", "Nom", "Prénom", "Établissement"];

    const rows = room.students.map((student, index) => [
      student.candidateNumber || formatCandidateNumber(index),
      student.lastName,
      student.firstName,
      student.schoolName || "-",
    ]);

    const wsData = [
      [`Salle ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ""}`],
      [`Effectif: ${room.students.length} / ${room.capacity} places`],
      [],
      headers,
      ...rows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    worksheet["!cols"] = [
      { wch: 12 }, // N° Candidat
      { wch: 25 }, // Nom
      { wch: 25 }, // Prénom
      { wch: 30 }, // Établissement
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Salle ${room.roomNumber}`,
    );
  }

  return workbook;
}

/**
 * Crée un PDF pour une salle spécifique
 */
function createRoomPdf(examInfo: ExamInfo, room: ExportRoom, config?: DocumentExportConfig): jsPDF {
  const doc = createPdfDocument("portrait", config);
  const pageWidth = doc.internal.pageSize.getWidth();
  const fs = resolveFontSize(config);
  let yPos = 15;

  // En-tête institutionnel
  if (config?.headerTitle) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.headerTitle.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerSubtitle) {
    doc.setFontSize(fs.body - 1);
    doc.setFont("helvetica", "normal");
    doc.text(config.headerSubtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.institutionName) {
    doc.setFontSize(fs.body);
    doc.setFont("helvetica", "bold");
    doc.text(config.institutionName, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (config?.headerTitle || config?.headerSubtitle || config?.institutionName) {
    yPos += 3;
  }

  // En-tête
  doc.setFontSize(fs.header);
  doc.setFont("helvetica", "bold");
  doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 10;

  doc.setFontSize(fs.subheader + 2);
  doc.text(
    `Salle ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ""}`,
    pageWidth / 2,
    yPos,
    { align: "center" },
  );
  yPos += 10;

  doc.setFontSize(fs.body);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Effectif: ${room.students.length} / ${room.capacity} places`,
    14,
    yPos,
  );
  yPos += 6;
  doc.text(`Date: ${formatDate()}`, 14, yPos);
  yPos += 7;

  const columns = ["N° Candidat", "Nom", "Prénom", "Établissement"];

  const rows = room.students.map((student, index) => [
    student.candidateNumber || formatCandidateNumber(index),
    student.lastName,
    student.firstName,
    student.schoolName || "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [columns],
    body: rows,
    styles: {
      fontSize: fs.body,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 55 },
    },
  });

  addPdfFooter(doc, config);

  return doc;
}

/**
 * Crée un PDF avec toutes les salles (une page par salle)
 */
function createAllRoomsPdf(examInfo: ExamInfo, rooms: ExportRoom[], config?: DocumentExportConfig): jsPDF {
  const doc = createPdfDocument("portrait", config);
  const pageWidth = doc.internal.pageSize.getWidth();
  const fs = resolveFontSize(config);
  const filledRooms = rooms.filter((r) => r.students.length > 0);

  filledRooms.forEach((room, roomIndex) => {
    if (roomIndex > 0) {
      doc.addPage();
    }

    let yPos = 15;

    // En-tête institutionnel
    if (config?.headerTitle) {
      doc.setFontSize(fs.body);
      doc.setFont("helvetica", "bold");
      doc.text(config.headerTitle.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
      yPos += 5;
    }
    if (config?.headerSubtitle) {
      doc.setFontSize(fs.body - 1);
      doc.setFont("helvetica", "normal");
      doc.text(config.headerSubtitle, pageWidth / 2, yPos, { align: "center" });
      yPos += 5;
    }
    if (config?.institutionName) {
      doc.setFontSize(fs.body);
      doc.setFont("helvetica", "bold");
      doc.text(config.institutionName, pageWidth / 2, yPos, { align: "center" });
      yPos += 5;
    }
    if (config?.headerTitle || config?.headerSubtitle || config?.institutionName) {
      yPos += 3;
    }

    // En-tête
    doc.setFontSize(fs.header);
    doc.setFont("helvetica", "bold");
    doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 10;

    doc.setFontSize(fs.body);
    doc.text(
      `Salle ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ""}`,
      pageWidth / 2,
      yPos,
      { align: "center" },
    );
    yPos += 10;

    const columns = ["N° Candidat", "Nom", "Prénom", "Établissement"];

    const rows = room.students.map((student, index) => [
      student.candidateNumber || formatCandidateNumber(index),
      student.lastName,
      student.firstName,
      student.schoolName || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [columns],
      body: rows,
      styles: {
        fontSize: fs.table + 1,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 55 },
      },
    });
  });

  addPdfFooter(doc, config);

  return doc;
}

/**
 * Exporte une salle en Excel
 */
export async function exportRoomToExcel(
  examInfo: ExamInfo,
  room: ExportRoom,
): Promise<void> {
  const workbook = createRoomWorkbook(examInfo, room);
  const filename = `salle_${room.roomNumber}_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

/**
 * Exporte toutes les salles en Excel (un fichier avec plusieurs feuilles)
 */
export async function exportAllRoomsToExcel(
  examInfo: ExamInfo,
  rooms: ExportRoom[],
): Promise<void> {
  const workbook = createAllRoomsWorkbook(examInfo, rooms);
  const filename = `repartition_salles_${examInfo.year}.xlsx`;

  if (isTauri()) {
    await downloadExcelTauri(workbook, filename);
  } else {
    downloadExcelWeb(workbook, filename);
  }
}

/**
 * Exporte une salle en PDF
 */
export async function exportRoomToPdf(
  examInfo: ExamInfo,
  room: ExportRoom,
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createRoomPdf(examInfo, room, config);
  const filename = `salle_${room.roomNumber}_${examInfo.year}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Exporte toutes les salles en PDF (une page par salle)
 */
export async function exportAllRoomsToPdf(
  examInfo: ExamInfo,
  rooms: ExportRoom[],
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createAllRoomsPdf(examInfo, rooms, config);
  const filename = `repartition_salles_${examInfo.year}.pdf`;

  if (isTauri()) {
    await downloadPdfTauri(doc, filename);
  } else {
    downloadPdfWeb(doc, filename);
  }
}

/**
 * Imprime une salle (ouvre le dialogue d'impression du navigateur)
 */
export async function printRoom(
  examInfo: ExamInfo,
  room: ExportRoom,
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createRoomPdf(examInfo, room, config);

  // Ouvrir dans un nouvel onglet pour impression
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url, "_blank");

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Imprime toutes les salles (ouvre le dialogue d'impression du navigateur)
 */
export async function printAllRooms(
  examInfo: ExamInfo,
  rooms: ExportRoom[],
  config?: DocumentExportConfig,
): Promise<void> {
  const doc = createAllRoomsPdf(examInfo, rooms, config);

  // Ouvrir dans un nouvel onglet pour impression
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(url, "_blank");

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
