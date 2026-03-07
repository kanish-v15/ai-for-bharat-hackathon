import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Draw a caduceus/medical symbol at the given position.
 * Uses jsPDF drawing primitives (lines, circles, arcs).
 */
function drawCaduceus(doc, cx, cy, scale = 1) {
  const s = scale;

  // Staff (vertical line)
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2 * s);
  doc.line(cx, cy - 12 * s, cx, cy + 14 * s);

  // Wings (V-shape at top)
  doc.setLineWidth(0.8 * s);
  doc.line(cx, cy - 12 * s, cx - 6 * s, cy - 16 * s);
  doc.line(cx, cy - 12 * s, cx + 6 * s, cy - 16 * s);
  // Wing tips
  doc.line(cx - 6 * s, cy - 16 * s, cx - 9 * s, cy - 14 * s);
  doc.line(cx + 6 * s, cy - 16 * s, cx + 9 * s, cy - 14 * s);

  // Top circle/knob
  doc.setFillColor(37, 99, 235);
  doc.circle(cx, cy - 13 * s, 1.5 * s, 'F');

  // Left serpent
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(1 * s);
  // Upper curve left
  doc.lines(
    [
      [-5 * s, 3 * s],
      [-3 * s, 4 * s],
      [5 * s, 2 * s],
    ],
    cx, cy - 8 * s
  );
  // Lower curve left
  doc.lines(
    [
      [-5 * s, 3 * s],
      [-3 * s, 4 * s],
      [5 * s, 2 * s],
    ],
    cx, cy - 1 * s
  );

  // Right serpent
  doc.setDrawColor(22, 163, 74);
  doc.lines(
    [
      [5 * s, 3 * s],
      [3 * s, 4 * s],
      [-5 * s, 2 * s],
    ],
    cx, cy - 8 * s
  );
  doc.lines(
    [
      [5 * s, 3 * s],
      [3 * s, 4 * s],
      [-5 * s, 2 * s],
    ],
    cx, cy - 1 * s
  );

  // Base horizontal
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8 * s);
  doc.line(cx - 5 * s, cy + 14 * s, cx + 5 * s, cy + 14 * s);
}

/**
 * Draw a simple medical cross symbol (more reliable than caduceus with curves).
 */
function drawMedicalCross(doc, cx, cy, size = 10) {
  const s = size;
  const t = s * 0.35; // thickness

  doc.setFillColor(37, 99, 235);
  // Vertical bar
  doc.roundedRect(cx - t / 2, cy - s / 2, t, s, 1, 1, 'F');
  // Horizontal bar
  doc.roundedRect(cx - s / 2, cy - t / 2, s, t, 1, 1, 'F');
}

/**
 * Generate a clinical prescription PDF styled like a real Indian clinic prescription.
 * Features: Medical symbol header, clinic letterhead with blue header bar,
 * patient demographics, SOAP notes, Rx prescription table, advice section, signature.
 */
export function generatePatientPDF({ patient, doctor = {}, consultations = [], includeAllConsultations = false }) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 14;
  const cw = pw - 2 * m;

  // Colors
  const navy = [15, 23, 42];
  const blue = [37, 99, 235];
  const darkBlue = [30, 58, 138];
  const gray = [71, 85, 105];
  const lightGray = [148, 163, 184];
  const lineColor = [203, 213, 225];
  const rxGreen = [22, 163, 74];
  const bgLight = [248, 250, 252];
  const headerBg = [239, 246, 255];
  const white = [255, 255, 255];

  const toRender = includeAllConsultations ? consultations : consultations.slice(0, 1);
  const now = new Date();
  const dateNow = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ═══════════════════════════════════════════════
  // Helper: Clinic Letterhead (like real prescription pad)
  // ═══════════════════════════════════════════════
  const addLetterhead = () => {
    const clinicName = doctor.clinicHospitalName || 'Medical Clinic';
    const drName = doctor.fullName ? `Dr. ${doctor.fullName}` : 'Doctor';
    const quals = [doctor.qualification, doctor.specialization].filter(Boolean).join(', ');
    const regNo = doctor.medicalRegNumber ? `Reg. No: ${doctor.medicalRegNumber}` : '';
    const addr = doctor.clinicAddress || {};
    const addressLine = [addr.district, addr.state, addr.pin ? `- ${addr.pin}` : ''].filter(Boolean).join(', ');
    const phone = doctor.phone ? `Ph: ${doctor.phone}` : '';

    // ─── Top blue header bar ───
    doc.setFillColor(...darkBlue);
    doc.rect(0, 0, pw, 4, 'F');

    // ─── Light header background ───
    doc.setFillColor(...headerBg);
    doc.rect(0, 4, pw, 38, 'F');

    // ─── Medical cross symbol on the left ───
    drawMedicalCross(doc, m + 8, 23, 12);

    // ─── Clinic Name (prominent, centered) ───
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkBlue);
    doc.text(clinicName.toUpperCase(), pw / 2, 18, { align: 'center' });

    // ─── Doctor name ───
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...blue);
    doc.text(drName, pw / 2, 26, { align: 'center' });

    // ─── Qualifications ───
    if (quals) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(quals, pw / 2, 31, { align: 'center' });
    }

    // ─── Contact info line ───
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    const infoParts = [regNo, addressLine, phone].filter(Boolean);
    if (infoParts.length > 0) {
      doc.text(infoParts.join('   |   '), pw / 2, 37, { align: 'center' });
    }

    // ─── Bottom blue line under header ───
    doc.setDrawColor(...blue);
    doc.setLineWidth(1);
    doc.line(0, 42, pw, 42);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...lineColor);
    doc.line(0, 43.2, pw, 43.2);

    return 48;
  };

  // ═══════════════════════════════════════════════
  // Helper: Footer
  // ═══════════════════════════════════════════════
  const addFooter = (pageNum, totalPages) => {
    // Footer separator
    doc.setDrawColor(...lineColor);
    doc.setLineWidth(0.3);
    doc.line(m, ph - 18, pw - m, ph - 18);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...lightGray);
    doc.text('This prescription is computer-generated. Not a substitute for professional medical advice.', m, ph - 13);

    doc.setFont('helvetica', 'normal');
    doc.text(`Generated by SwasthyaMitra  |  ${dateNow}`, pw - m, ph - 13, { align: 'right' });
    doc.text(`Page ${pageNum} of ${totalPages}`, pw - m, ph - 9, { align: 'right' });
  };

  // ═══════════════════════════════════════════════
  // PAGE: Letterhead + Patient Info + Consultations
  // ═══════════════════════════════════════════════
  let y = addLetterhead();

  // ─── Patient Information Box ───
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...lineColor);
  doc.setLineWidth(0.3);
  const patBoxH = 28;
  doc.roundedRect(m, y, cw, patBoxH, 2, 2, 'FD');

  // Blue left accent bar on patient box
  doc.setFillColor(...blue);
  doc.roundedRect(m, y, 3, patBoxH, 1, 1, 'F');

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...blue);
  doc.text('PATIENT DETAILS', m + 7, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text(`Date: ${dateNow}`, pw - m - 4, y, { align: 'right' });

  y += 6;
  const col1 = m + 7;
  const col2 = m + cw * 0.35;
  const col3 = m + cw * 0.65;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text(patient.name || 'Patient', col1, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...gray);
  doc.text(`Age: ${patient.age || '--'} yrs`, col2, y);
  doc.text(`Gender: ${patient.gender || '--'}`, col3, y);

  y += 5.5;
  // Row 2
  doc.text(`Phone: ${patient.phone || '--'}`, col1, y);
  doc.text(`Blood Group: ${patient.bloodGroup || '--'}`, col2, y);
  const langLabel = patient.language ? patient.language.charAt(0).toUpperCase() + patient.language.slice(1) : '--';
  doc.text(`Language: ${langLabel}`, col3, y);

  y += 5.5;
  // Row 3
  doc.text(`Allergies: ${patient.allergies || 'None'}`, col1, y);
  doc.text(`Conditions: ${patient.conditions || 'None'}`, col2, y);
  doc.text(`Medications: ${patient.medications || 'None'}`, col3, y);

  y = y + 10;

  // ─── Consultations ───
  if (toRender.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...lightGray);
    doc.text('No consultation records available.', m, y + 5);
  }

  toRender.forEach((consult, idx) => {
    if (y > 220) { doc.addPage(); y = addLetterhead(); }

    // Consultation date header
    const cDate = new Date(consult.date);
    const cDateStr = cDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const cTimeStr = cDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (idx > 0) {
      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.3);
      doc.line(m, y, pw - m, y);
      y += 5;
    }

    // Consultation header with blue background pill
    doc.setFillColor(...blue);
    doc.roundedRect(m, y - 4, cw, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text(`CONSULTATION  -  ${cDateStr}  ${cTimeStr}`, m + 4, y + 1);
    y += 10;

    // ─── SOAP Notes ───
    const soapSections = [
      { label: 'S  |  Chief Complaint', content: consult.soap_note?.subjective, color: [220, 38, 38] },
      { label: 'O  |  Examination', content: consult.soap_note?.objective, color: [37, 99, 235] },
      { label: 'A  |  Diagnosis', content: consult.soap_note?.assessment, color: [147, 51, 234] },
      { label: 'P  |  Treatment Plan', content: consult.soap_note?.plan, color: [22, 163, 74] },
    ];

    soapSections.forEach(({ label, content, color }) => {
      if (!content) return;
      if (y > 245) { doc.addPage(); y = addLetterhead(); }

      // SOAP letter with colored left bar
      doc.setFillColor(...color);
      doc.rect(m, y - 3.5, 2, 5, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.text(label, m + 5, y);
      y += 5;

      // Content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      const lines = doc.splitTextToSize(content, cw - 6);
      doc.text(lines, m + 5, y);
      y += lines.length * 4.2 + 5;
    });

    // ─── Prescription (Rx) ───
    if (consult.medications?.length > 0) {
      if (y > 215) { doc.addPage(); y = addLetterhead(); }

      // Rx header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...rxGreen);
      doc.text('Rx', m, y + 2);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text('Prescription', m + 16, y);
      y += 5;

      const medRows = consult.medications.map((med, i) => [
        String(i + 1),
        med.name || '--',
        med.dosage || '--',
        med.frequency || '--',
        med.duration || '--',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['#', 'Medication', 'Dosage', 'Frequency', 'Duration']],
        body: medRows,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: navy,
          lineColor: lineColor,
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: darkBlue,
          textColor: white,
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: bgLight },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { fontStyle: 'bold', cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 },
        },
        margin: { left: m, right: m },
      });

      y = doc.lastAutoTable.finalY + 8;
    }

    // ─── Patient Instructions / Advice ───
    const instructions = consult.patient_instructions_translated || consult.patient_instructions;
    if (instructions) {
      if (y > 230) { doc.addPage(); y = addLetterhead(); }

      // Advice header
      doc.setFillColor(...rxGreen);
      doc.roundedRect(m, y - 4, cw, 7, 1.5, 1.5, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('ADVICE / PATIENT INSTRUCTIONS', m + 4, y);
      y += 7;

      // Instruction text with green left border
      doc.setDrawColor(...rxGreen);
      doc.setLineWidth(1.5);
      const instrLines = doc.splitTextToSize(instructions, cw - 10);
      const instrHeight = instrLines.length * 4.2 + 2;
      doc.line(m + 1, y - 2, m + 1, y + instrHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      doc.text(instrLines, m + 6, y);
      y += instrHeight + 6;
    }

    // ─── Signature area ───
    if (y > 240) { doc.addPage(); y = addLetterhead(); }

    y += 10;

    // Signature line on right
    const sigX = pw - m - 60;
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.line(sigX, y, pw - m, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text(doctor.fullName ? `Dr. ${doctor.fullName}` : "Doctor's Signature", sigX + 30, y, { align: 'center' });
    y += 4;

    if (doctor.qualification) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(doctor.qualification, sigX + 30, y, { align: 'center' });
      y += 3.5;
    }
    if (doctor.medicalRegNumber) {
      doc.setFontSize(7.5);
      doc.setTextColor(...lightGray);
      doc.text(`Reg: ${doctor.medicalRegNumber}`, sigX + 30, y, { align: 'center' });
    }

    y += 10;
  });

  // ─── Add footers to all pages ───
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save
  const filename = `Prescription_${(patient.name || 'Patient').replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
