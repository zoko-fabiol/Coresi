import { jsPDF } from 'jspdf';
import { Mission, MissionExpense } from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export class MissionService {
  /**
   * Request a new mission
   */
  public static async requestMission(
    data: Omit<Mission, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'status' | 'actualTotalCost' | 'balanceAmount' | 'expenses'> & {
      status?: Mission['status'];
    }
  ): Promise<Mission> {
    const reference = AdminConfigService.getNextSequenceNumber('mis');
    const id = `mis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const mission: Mission = {
      ...data,
      id,
      reference,
      status: data.status || 'demande',
      actualTotalCost: 0,
      balanceAmount: data.advanceGiven || data.advanceRequested || 0,
      expenses: [],
      createdAt: now,
      updatedAt: now,
    };

    await DataService.saveMission(mission);
    return mission;
  }

  /**
   * Approve a mission and grant advance (DG / Direction)
   */
  public static async approveMission(
    missionId: string,
    advanceGrantedAmount: number,
    paymentMethod: string,
    approverName: string
  ): Promise<void> {
    const missions = DataService.getMissions();
    const mis = missions.find((m) => m.id === missionId);
    if (!mis) return;

    mis.status = 'approuvee_dg';
    mis.advanceGiven = advanceGrantedAmount;
    mis.advancePaymentMethod = paymentMethod;
    mis.balanceAmount = advanceGrantedAmount;
    mis.approvedBy = approverName;
    mis.approvedAt = new Date().toISOString();
    mis.updatedAt = new Date().toISOString();

    await DataService.saveMission(mis);
  }

  /**
   * Add a justification expense to the mission
   */
  public static async addExpense(
    missionId: string,
    expense: Omit<MissionExpense, 'id'>
  ): Promise<void> {
    const missions = DataService.getMissions();
    const mis = missions.find((m) => m.id === missionId);
    if (!mis) return;

    const newExp: MissionExpense = {
      ...expense,
      id: `mexp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    mis.expenses.push(newExp);
    mis.actualTotalCost = mis.expenses.reduce((sum, e) => sum + e.amount, 0);
    mis.balanceAmount = (mis.advanceGiven || 0) - mis.actualTotalCost;
    mis.updatedAt = new Date().toISOString();

    await DataService.saveMission(mis);
  }

  /**
   * Finalize liquidation of mission expenses vs advance
   */
  public static async liquidateMission(
    missionId: string,
    liquidationNotes: string
  ): Promise<{ balance: number; refundRequired: boolean }> {
    const missions = DataService.getMissions();
    const mis = missions.find((m) => m.id === missionId);
    if (!mis) throw new Error('Mission introuvable');

    mis.actualTotalCost = mis.expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = (mis.advanceGiven || 0) - mis.actualTotalCost;
    mis.balanceAmount = balance;
    mis.status = 'soldee';
    mis.liquidationNotes = liquidationNotes;
    mis.updatedAt = new Date().toISOString();

    await DataService.saveMission(mis);

    return {
      balance,
      refundRequired: balance > 0, // Employee owes money back to company if positive
    };
  }

  /**
   * Generates official Ordre de Mission document via jsPDF
   */
  public static generateMissionOrderPdf(mission: Mission): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const comp = AdminConfigService.getCompanySettings();

    // 1. Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(comp.name, 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`${comp.legalForm} • ${comp.registrationNumber} • ${comp.taxId}`, 14, 21);
    doc.text(`${comp.address}, ${comp.city} — ${comp.country} | Tél: ${comp.phone}`, 14, 26);

    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 34, 210, 2, 'F');

    // 2. Title
    let y = 48;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ORDRE DE MISSION OFFICIEL', 105, y, { align: 'center' });

    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`RÉFÉRENCE : ${mission.reference}`, 105, y, { align: 'center' });

    y += 12;
    // Employee & Destination details box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 54, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nom & Prénom du missionnaire :', 20, y + 8);
    doc.text('Fonction / Rôle :', 20, y + 16);
    doc.text('Projet de rattachement :', 20, y + 24);
    doc.text('Destination exacte :', 20, y + 32);
    doc.text('Période du déplacement :', 20, y + 40);
    doc.text('Mode de transport principal :', 20, y + 48);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${mission.employeeName} (${mission.employeeMatricule || 'Matricule non spécifié'})`, 75, y + 8);
    doc.text(mission.employeeRole || 'Collaborateur CORESI', 75, y + 16);
    doc.text(mission.projectName || 'Non rattaché', 75, y + 24);
    doc.text(mission.destination, 75, y + 32);
    doc.text(`Du ${mission.startDate} au ${mission.endDate} (${mission.durationDays} jours)`, 75, y + 40);
    doc.text((mission.transportType || 'Route').toUpperCase(), 75, y + 48);

    y += 64;

    // Mission Purpose
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('OBJET ET INSTRUCTIONS DE LA MISSION', 14, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const purposeLines = doc.splitTextToSize(mission.purpose, 182);
    doc.text(purposeLines, 14, y);
    y += purposeLines.length * 4.5 + 8;

    // Financial Advance box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 28, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('DISPOSITIONS FINANCIÈRES & AVANCES ALLOUÉES', 20, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Budget estimatif total : ${mission.estimatedCost.toLocaleString('fr-FR')} FCFA`, 20, y + 15);
    doc.text(`Avance octroyée : ${(mission.advanceGiven || 0).toLocaleString('fr-FR')} FCFA`, 20, y + 22);
    doc.text(`Mode de règlement avance : ${mission.advancePaymentMethod || 'Caisse Centrale'}`, 110, y + 15);
    doc.text(`Statut mission : ${mission.status.toUpperCase()}`, 110, y + 22);

    y += 38;

    // Legal notice
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Ce document confère au porteur la qualité de représentant en mission pour le compte de CORESI INTERNATIONAL SARL. Les autorités civiles et militaires sont priées de lui prêter assistance en cas de besoin.',
      14,
      y,
      { maxWidth: 182 }
    );

    // Signatures
    y += 24;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('SIGNATURE DU MISSIONNAIRE', 20, y);
    doc.text('POUR LA DIRECTION GÉNÉRALE (VISA / SCEAU)', 115, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Bon pour accord et engagement', 20, y);

    if (mission.approvedBy) {
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.setFont('helvetica', 'bold');
      doc.text('ORDRE DE MISSION DÛMENT APPROUVÉ', 115, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Par : ${mission.approvedBy}`, 115, y + 4);
      doc.text(`Le : ${mission.approvedAt ? mission.approvedAt.split('T')[0] : ''}`, 115, y + 8);
    } else {
      doc.text('En attente de visa Direction Générale', 115, y);
    }

    doc.save(`${mission.reference}_Ordre_Mission.pdf`);
  }
}
