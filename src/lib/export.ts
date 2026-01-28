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
  status: "admitted" | "failed" | "pending";
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
  filterStatus?: "all" | "admitted" | "failed";
  sortBy?: "rank" | "name" | "school";
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
function getStatusLabel(status: "admitted" | "failed" | "pending"): string {
  switch (status) {
    case "admitted":
      return "Admis";
    case "failed":
      return "Ajourné";
    case "pending":
      return "En attente";
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
  const wsData = [
    [`${examInfo.name} - Session ${examInfo.year}`],
    [`Date d'export: ${formatDate()}`],
    [`Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`],
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
): jsPDF {
  return new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });
}

/**
 * Ajoute l'en-tête d'examen au document PDF
 */
function addPdfHeader(doc: jsPDF, examInfo: ExamInfo, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Titre de l'examen
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, 20, {
    align: "center",
  });

  // Sous-titre
  doc.setFontSize(12);
  doc.text(title, pageWidth / 2, 28, { align: "center" });

  // Informations
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'export: ${formatDate()}`, 14, 38);
  doc.text(
    `Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`,
    14,
    44,
  );

  return 50; // Y position après l'en-tête
}

/**
 * Crée un PDF avec les résultats des élèves
 */
function createResultsPdf(
  examInfo: ExamInfo,
  students: ExportStudent[],
  subjects: Array<{ id: string; name: string; coefficient: number | null }>,
  options: ExportOptions = {},
): jsPDF {
  // Utiliser l'orientation paysage si beaucoup de colonnes
  const useScores = options.includeScores && subjects.length > 0;
  const orientation =
    useScores && subjects.length > 4 ? "landscape" : "portrait";

  const doc = createPdfDocument(orientation);
  const startY = addPdfHeader(doc, examInfo, "Procès-verbal de délibération");

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
      fontSize: 8,
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

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total: ${filteredStudents.length} candidats | Admis: ${admitted} | Ajournés: ${failed}`,
    14,
    finalY,
  );

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
): jsPDF {
  // Utiliser l'orientation paysage si beaucoup de colonnes
  const useScores = options.includeScores && subjects.length > 0;
  const orientation =
    useScores && subjects.length > 4 ? "landscape" : "portrait";

  const doc = createPdfDocument(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête personnalisé pour l'établissement
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, 20, {
    align: "center",
  });

  doc.setFontSize(14);
  doc.text(schoolName, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'export: ${formatDate()}`, 14, 38);
  doc.text(
    `Seuil de réussite: ${examInfo.passingGrade}/${examInfo.maxGrade}`,
    14,
    44,
  );

  const startY = 50;

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
      fontSize: 8,
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

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total: ${filteredStudents.length} candidats | Admis: ${admitted} | Ajournés: ${failed} | Taux de réussite: ${successRate}%`,
    14,
    finalY,
  );

  return doc;
}

/**
 * Crée un PDF avec les statistiques par établissement
 */
function createSchoolStatsPdf(
  examInfo: ExamInfo,
  schoolStats: SchoolStats[],
): jsPDF {
  const doc = createPdfDocument("portrait");
  const startY = addPdfHeader(doc, examInfo, "Statistiques par établissement");

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
      fontSize: 10,
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

  return doc;
}

/**
 * Crée un PDF avec les statistiques par épreuve
 */
function createSubjectStatsPdf(
  examInfo: ExamInfo,
  subjectStats: SubjectStats[],
): jsPDF {
  const doc = createPdfDocument("portrait");
  const startY = addPdfHeader(doc, examInfo, "Statistiques par épreuve");

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
      fontSize: 10,
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
): Promise<void> {
  const doc = createResultsPdf(examInfo, students, subjects, options);
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
): Promise<void> {
  const doc = createSchoolStatsPdf(examInfo, schoolStats);
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
): Promise<void> {
  const doc = createSubjectStatsPdf(examInfo, subjectStats);
  const filename = `stats_epreuves_${examInfo.year}.pdf`;

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
function createRoomPdf(examInfo: ExamInfo, room: ExportRoom): jsPDF {
  const doc = createPdfDocument("portrait");
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, 20, {
    align: "center",
  });

  doc.setFontSize(14);
  doc.text(
    `Salle ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ""}`,
    pageWidth / 2,
    30,
    { align: "center" },
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Effectif: ${room.students.length} / ${room.capacity} places`,
    14,
    42,
  );
  doc.text(`Date: ${formatDate()}`, 14, 48);

  const columns = ["N° Candidat", "Nom", "Prénom", "Établissement"];

  const rows = room.students.map((student, index) => [
    student.candidateNumber || formatCandidateNumber(index),
    student.lastName,
    student.firstName,
    student.schoolName || "-",
  ]);

  autoTable(doc, {
    startY: 55,
    head: [columns],
    body: rows,
    styles: {
      fontSize: 10,
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

  return doc;
}

/**
 * Crée un PDF avec toutes les salles (une page par salle)
 */
function createAllRoomsPdf(examInfo: ExamInfo, rooms: ExportRoom[]): jsPDF {
  const doc = createPdfDocument("portrait");
  const pageWidth = doc.internal.pageSize.getWidth();
  const filledRooms = rooms.filter((r) => r.students.length > 0);

  filledRooms.forEach((room, roomIndex) => {
    if (roomIndex > 0) {
      doc.addPage();
    }

    // En-tête
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${examInfo.name} - Session ${examInfo.year}`, pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(
      `Salle ${room.roomNumber}${room.roomName ? ` - ${room.roomName}` : ""}`,
      pageWidth / 2,
      30,
      { align: "center" },
    );

    const columns = ["N° Candidat", "Nom", "Prénom", "Établissement"];

    const rows = room.students.map((student, index) => [
      student.candidateNumber || formatCandidateNumber(index),
      student.lastName,
      student.firstName,
      student.schoolName || "-",
    ]);

    autoTable(doc, {
      startY: 55,
      head: [columns],
      body: rows,
      styles: {
        fontSize: 9,
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
): Promise<void> {
  const doc = createRoomPdf(examInfo, room);
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
): Promise<void> {
  const doc = createAllRoomsPdf(examInfo, rooms);
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
): Promise<void> {
  const doc = createRoomPdf(examInfo, room);

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
): Promise<void> {
  const doc = createAllRoomsPdf(examInfo, rooms);

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
