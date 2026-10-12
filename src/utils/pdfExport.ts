import { jsPDF } from 'jspdf';
import { Rapport, Tache } from '../types/database';
import { formatDateFrench, formatTime } from './dateUtils';
import { LOGO_BASE64 } from './logoBase64';

export function exportRapportToPDF(rapport: Rapport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  const taches: Tache[] = rapport.taches || [];
  const totalTasks = taches.length;
  const completedTasks = taches.filter((t) => t.statut === 'Terminée').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const reportRef = `RAP-${rapport.date_rapport.replace(/-/g, '')}-${rapport.id.substring(0, 4).toUpperCase()}`;

  // Helper pour vérifier et effectuer un saut de page
  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - margin - 12) {
      doc.addPage();
      y = margin + 10;
      drawRunningHeader();
    }
  };

  // En-tête courant sur les pages secondaires (pages > 1)
  const drawRunningHeader = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, margin + 4, pageWidth - margin, margin + 4);

    try {
      doc.addImage(LOGO_BASE64, 'PNG', margin, margin - 1.5, 4.5, 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(234, 88, 12);
      doc.text('THE TIC MANAGER', margin + 6, margin + 2);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(234, 88, 12);
      doc.text('THE TIC MANAGER', margin, margin + 2);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Rapport du ${formatDateFrench(rapport.date_rapport)} — Réf : ${reportRef}`, pageWidth - margin, margin + 2, {
      align: 'right',
    });
  };

  // =========================================================================
  // 1. BANDEAU D'EN-TÊTE PRINCIPAL (Page 1)
  // =========================================================================
  // Fond principal orange de l'en-tête
  doc.setFillColor(249, 115, 22); // Orange #F97316
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  // Logo de l'application
  try {
    doc.addImage(LOGO_BASE64, 'PNG', margin + 4, y + 3, 18, 18);
  } catch {
    // Si l'image ne peut pas être rendue, continuer sans blocage
  }

  // Titre principal
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('THE TIC MANAGER', margin + 25, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 237, 213);
  doc.text('RAPPORT JOURNALIER D\'ACTIVITÉ & SUIVI DES TÂCHES', margin + 25, y + 16.5);

  // Bloc de droite : Date & Réf
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatDateFrench(rapport.date_rapport), pageWidth - margin - 6, y + 9.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 237, 213);
  doc.text(`RÉF : ${reportRef}`, pageWidth - margin - 6, y + 16.5, { align: 'right' });

  y += 28;

  // Titre du rapport
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(rapport.titre, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 1;

  // Lieu / Service sous le titre
  if (rapport.lieu_service) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Lieu / Service : ${rapport.lieu_service}`, margin, y);
    y += 5.5;
  }

  // =========================================================================
  // 2. SYNTHÈSE DES CHIFFRES CLÉS (METRICS GRID BOX)
  // =========================================================================
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 13;

  // Bloc 1 : Total Tâches
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DES TÂCHES', margin + 4, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalTasks} tâche${totalTasks > 1 ? 's' : ''}`, margin + 4, y + 10);

  // Bloc 2 : Tâches Terminées
  const b2X = margin + cardWidth + 3;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(b2X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52);
  doc.text('TÂCHES ACCOMPLIES', b2X + 4, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text(`${completedTasks} sur ${totalTasks}`, b2X + 4, y + 10);

  // Bloc 3 : Taux de réalisation
  const b3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(b3X, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(194, 65, 12);
  doc.text('TAUX D\'ACHÈVEMENT', b3X + 4, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`${completionRate}%`, b3X + 4, y + 10);

  y += cardHeight + 6;

  // =========================================================================
  // 3. OBJECTIF DU JOUR
  // =========================================================================
  if (rapport.objectif) {
    checkPageBreak(22);

    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(254, 215, 170);
    const objLines = doc.splitTextToSize(rapport.objectif, contentWidth - 8);
    const boxH = Math.max(14, objLines.length * 4.5 + 8);

    doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');
    doc.setFillColor(234, 88, 12);
    doc.rect(margin, y, 2.5, boxH, 'F'); // Barre verticale orange

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(194, 65, 12);
    doc.text('OBJECTIF DE LA JOURNÉE', margin + 6, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(objLines, margin + 6, y + 10);

    y += boxH + 5;
  }

  // =========================================================================
  // 4. RÉSUMÉ GÉNÉRAL DES ACTIVITÉS
  // =========================================================================
  if (rapport.resume) {
    checkPageBreak(25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('RÉSUMÉ GÉNÉRAL DES ACTIVITÉS', margin, y);
    y += 4.5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const resumeLines = doc.splitTextToSize(rapport.resume, contentWidth - 8);
    const resumeH = Math.max(12, resumeLines.length * 4.2 + 6);

    doc.roundedRect(margin, y, contentWidth, resumeH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(resumeLines, margin + 4, y + 5);

    y += resumeH + 6;
  }

  // =========================================================================
  // 5. TABLEAU DÉTAILLÉ DES TÂCHES
  // =========================================================================
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`DÉTAIL DES INTERVENTIONS & TÂCHES (${totalTasks})`, margin, y);
  y += 4.5;

  // Fonction pour dessiner les en-têtes du tableau
  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 6.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    doc.text('INTITULÉ & DÉTAILS', margin + 3, y + 4.5);
    doc.text('CATÉGORIE', margin + 96, y + 4.5);
    doc.text('HORAIRES', margin + 130, y + 4.5);
    doc.text('STATUT / PRIORITÉ', margin + 154, y + 4.5);
    y += 6.5;
  };

  drawTableHeader();

  if (taches.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 9, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Aucune tâche rattachée à ce compte-rendu.', margin + 4, y + 5.5);
    y += 11;
  } else {
    taches.forEach((task, idx) => {
      // Découper les textes pour mesurer la hauteur exacte
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const titleLines = doc.splitTextToSize(`${idx + 1}. ${task.intitule}`, 88);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const descLines = task.description ? doc.splitTextToSize(task.description, 88) : [];
      const resultLines = task.resultat ? doc.splitTextToSize(`Résultat : ${task.resultat}`, 88) : [];
      const diffLines = task.difficultes ? doc.splitTextToSize(`Difficulté : ${task.difficultes}`, 88) : [];

      let taskTextH = titleLines.length * 3.8;
      if (descLines.length > 0) taskTextH += descLines.length * 3.3 + 1;
      if (resultLines.length > 0) taskTextH += resultLines.length * 3.3 + 1;
      if (diffLines.length > 0) taskTextH += diffLines.length * 3.3 + 1;

      const rowH = Math.max(10, taskTextH + 4);

      // Si la ligne déborde de la page, sauter de page et réimprimer l'en-tête
      if (y + rowH > pageHeight - margin - 12) {
        doc.addPage();
        y = margin + 10;
        drawRunningHeader();
        drawTableHeader();
      }

      // Fond alterné pour une lecture claire
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowH, 'FD');

      // 1. Colonne Intitulé + Sous-textes
      let currentSubY = y + 3.8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(titleLines, margin + 3, currentSubY);
      currentSubY += titleLines.length * 3.8;

      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(descLines, margin + 5, currentSubY);
        currentSubY += descLines.length * 3.3 + 1;
      }

      if (resultLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(22, 101, 52);
        doc.text(resultLines, margin + 5, currentSubY);
        currentSubY += resultLines.length * 3.3 + 1;
      }

      if (diffLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(185, 28, 28);
        doc.text(diffLines, margin + 5, currentSubY);
      }

      // 2. Colonne Catégorie
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const catLines = doc.splitTextToSize(task.categorie || '—', 30);
      doc.text(catLines, margin + 96, y + 4);

      // 3. Colonne Horaires
      const timeStr = task.heure_debut
        ? `${formatTime(task.heure_debut)} - ${formatTime(task.heure_fin)}`
        : 'Journée';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(timeStr, margin + 130, y + 4);

      // 4. Colonne Statut & Priorité
      let statusColor = [100, 116, 139]; // Slate
      if (task.statut === 'Terminée') statusColor = [22, 163, 74]; // Vert
      else if (task.statut === 'En cours') statusColor = [234, 88, 12]; // Orange
      else if (task.statut === 'Bloquée') statusColor = [220, 38, 38]; // Rouge

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(task.statut, margin + 154, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Priorité : ${task.priorite}`, margin + 154, y + 7.5);

      y += rowH;
    });

    y += 5;
  }

  // =========================================================================
  // 6. DIFFICULTÉS & SOLUTIONS APPORTÉES
  // =========================================================================
  if (rapport.difficultes || rapport.solutions) {
    checkPageBreak(30);

    const hasBoth = rapport.difficultes && rapport.solutions;
    const splitW = hasBoth ? (contentWidth - 4) / 2 : contentWidth;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('POINTS D\'ATTENTION & ACTIONS CORRECTIVES', margin, y);
    y += 4.5;

    let maxBoxH = 14;
    const diffLines = rapport.difficultes ? doc.splitTextToSize(rapport.difficultes, splitW - 6) : [];
    const solLines = rapport.solutions ? doc.splitTextToSize(rapport.solutions, splitW - 6) : [];

    const hDiff = diffLines.length * 4 + 10;
    const hSol = solLines.length * 4 + 10;
    maxBoxH = Math.max(hDiff, hSol);

    // Bloc Difficultés
    if (rapport.difficultes) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, splitW, maxBoxH, 1.5, 1.5, 'FD');
      doc.setFillColor(220, 38, 38);
      doc.rect(margin, y, 2, maxBoxH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      doc.text('DIFFICULTÉS RENCONTRÉES', margin + 4.5, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(127, 29, 29);
      doc.text(diffLines, margin + 4.5, y + 9.5);
    }

    // Bloc Solutions
    if (rapport.solutions) {
      const solX = hasBoth ? margin + splitW + 4 : margin;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(solX, y, splitW, maxBoxH, 1.5, 1.5, 'FD');
      doc.setFillColor(22, 163, 74);
      doc.rect(solX, y, 2, maxBoxH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(21, 128, 61);
      doc.text('SOLUTIONS APPORTÉES', solX + 4.5, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(20, 83, 45);
      doc.text(solLines, solX + 4.5, y + 9.5);
    }

    y += maxBoxH + 5;
  }

  // =========================================================================
  // 7. COMPÉTENCES ACQUISES & OBSERVATIONS
  // =========================================================================
  if (rapport.competences_acquises || rapport.observations) {
    checkPageBreak(22);

    if (rapport.competences_acquises) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      const compLines = doc.splitTextToSize(rapport.competences_acquises, contentWidth - 8);
      const compH = Math.max(12, compLines.length * 4 + 7);

      doc.roundedRect(margin, y, contentWidth, compH, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('COMPÉTENCES ET CONNAISSANCES ACQUISES', margin + 4, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(compLines, margin + 4, y + 9.2);

      y += compH + 4;
    }

    if (rapport.observations) {
      checkPageBreak(18);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      const obsLines = doc.splitTextToSize(rapport.observations, contentWidth - 8);
      const obsH = Math.max(12, obsLines.length * 4 + 7);

      doc.roundedRect(margin, y, contentWidth, obsH, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('OBSERVATIONS SUPPLÉMENTAIRES', margin + 4, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(obsLines, margin + 4, y + 9.2);

      y += obsH + 5;
    }
  }

  // =========================================================================
  // 8. ZONE DE VISA / SIGNATURE
  // =========================================================================
  checkPageBreak(20);
  y += 2;
  const signW = (contentWidth - 6) / 2;
  const signH = 16;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, signW, signH, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RÉDACTEUR / INTERVENANT', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Date & Signature :', margin + 3, y + 13);

  const sign2X = margin + signW + 6;
  doc.rect(sign2X, y, signW, signH, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RESPONSABLE HIÉRARCHIQUE / VALIDATEUR', sign2X + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Visa & Remarques :', sign2X + 3, y + 13);

  // =========================================================================
  // 9. PIED DE PAGE NUMÉROTÉ SUR TOUTES LES PAGES
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  const now = new Date();
  const dateFormattedNow = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Ligne de séparation fine en bas
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Texte gauche : Nom de la plateforme + timestamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`THE TIC MANAGER • Émis le ${dateFormattedNow} • Réf : ${reportRef}`, margin, pageHeight - 7);

    // Texte droite : Numérotation des pages
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Téléchargement sécurisé
  const sanitizedTitle = rapport.titre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `THE_TIC_MANAGER_Rapport_${rapport.date_rapport}_${sanitizedTitle}.pdf`;
  doc.save(filename);
}

export function printCurrentReport(): void {
  window.print();
}
