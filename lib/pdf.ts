'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Profile } from './types';

interface BackupOptions {
  role: string;
  userName: string;
  title: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}

const ROYAL: [number, number, number] = [15, 41, 66];
const AMBER: [number, number, number] = [217, 93, 22];
const IVORY: [number, number, number] = [250, 248, 243];

function drawHeader(doc: jsPDF, subtitle: string) {
  doc.setFillColor(...ROYAL);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ARRUPE College, Batticaloa', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...AMBER);
  doc.text(subtitle, 14, 20);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('School Management System', 14, 26);
}

function drawFooter(doc: jsPDF, timestamp: string, role: string, title: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `ARRUPE College, Batticaloa | Confidential | Page ${i} of ${pageCount}`,
      105,
      286,
      { align: 'center' }
    );
    doc.setFontSize(7);
    doc.text(
      `Extracted: ${timestamp} | Role: ${role.toUpperCase()} | ${title}`,
      105,
      291,
      { align: 'center' }
    );
  }
}

export function downloadMonthlyBackup(opts: BackupOptions) {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawHeader(doc, `Monthly Backup - ${opts.title}`);

  // User info
  doc.setTextColor(...ROYAL);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`User: ${opts.userName}`, 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Role: ${opts.role.toUpperCase()}`, 14, 48);

  // Summary block
  let y = 56;
  if (opts.summary && opts.summary.length) {
    doc.setFillColor(...IVORY);
    doc.rect(14, y - 4, 182, 6 + opts.summary.length * 6, 'F');
    doc.setTextColor(...ROYAL);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 16, y + 1);
    doc.setFont('helvetica', 'normal');
    y += 7;
    opts.summary.forEach((s) => {
      doc.text(`${s.label}: ${s.value}`, 16, y);
      y += 6;
    });
    y += 4;
  }

  // Table
  autoTable(doc, {
    startY: y,
    head: [opts.columns],
    body: opts.rows.map((r) => r.map((c) => String(c))),
    theme: 'grid',
    headStyles: {
      fillColor: ROYAL,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: ROYAL,
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: IVORY,
    },
    margin: { left: 14, right: 14 },
  });

  drawFooter(doc, timestamp, opts.role, opts.title);

  const filename = `backup_${opts.role}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function downloadInvoicePDF(invoice: any, student: any, payments: any[]) {
  const now = new Date();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(...ROYAL);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ARRUPE COLLEGE', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...AMBER);
  doc.text('Batticaloa', 14, 22);
  doc.setTextColor(255, 255, 255);
  doc.text('Excellence in Education', 14, 28);
  doc.text('Batticaloa, Sri Lanka', 14, 34);

  // Invoice title
  doc.setTextColor(...ROYAL);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE RECEIPT', 14, 54);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 62);
  doc.text(`Date: ${now.toLocaleDateString()}`, 14, 68);
  doc.text(`Term: ${invoice.term} (${invoice.academic_year})`, 14, 74);

  // Student info box
  doc.setFillColor(...IVORY);
  doc.rect(14, 82, 182, 22, 'F');
  doc.setTextColor(...ROYAL);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Details', 16, 89);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${student?.full_name ?? 'N/A'}`, 16, 95);
  doc.text(`Admission #: ${student?.admission_number ?? 'N/A'}`, 16, 100);

  // Fee breakdown table
  autoTable(doc, {
    startY: 110,
    head: [['Fee Component', 'Amount (Rs.)']],
    body: [
      ['Tuition Fee', invoice.tuition_fee.toFixed(2)],
      ['Library Fee', invoice.library_fee.toFixed(2)],
      ['Lab Fee', invoice.lab_fee.toFixed(2)],
      ['Sports Fee', invoice.sports_fee.toFixed(2)],
      ['Other Fee', invoice.other_fee.toFixed(2)],
    ],
    foot: [['Total', `Rs. ${invoice.total_amount.toFixed(2)}`]],
    theme: 'grid',
    headStyles: { fillColor: ROYAL, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: AMBER, textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: ROYAL },
    margin: { left: 14, right: 14 },
  });

  // Payment history
  if (payments.length) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Payment Date', 'Method', 'Reference', 'Amount']],
      body: payments.map((p) => [
        p.payment_date,
        p.payment_method.replace('_', ' ').toUpperCase(),
        p.payment_reference ?? '-',
        `Rs. ${p.amount.toFixed(2)}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: ROYAL, textColor: 255 },
      bodyStyles: { textColor: ROYAL },
      margin: { left: 14, right: 14 },
    });
  }

  // Balance
  const balance = invoice.total_amount - invoice.amount_paid;
  (doc as any).lastAutoTable;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ROYAL);
  const balanceY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 14
    : 164;
  doc.text(`Amount Paid: Rs. ${invoice.amount_paid.toFixed(2)}`, 14, balanceY);
  doc.text(`Balance Due: Rs. ${balance.toFixed(2)}`, 14, balanceY + 7);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, balanceY + 14);

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('This is a computer-generated receipt and is valid without signature.', 105, 280, {
    align: 'center',
  });
  doc.text(`Generated on ${now.toLocaleString()}`, 105, 286, { align: 'center' });

  doc.save(`invoice_${invoice.invoice_number}.pdf`);
}
