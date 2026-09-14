import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FormData, CompletenessData, RiskAssessmentData, RootCauseData, CAPAData } from '../store/complaintSlice'

export const generateComplaintAuditPDF = (
  formData: FormData,
  completeness: CompletenessData | null,
  risk: RiskAssessmentData | null,
  rootCause: RootCauseData | null,
  capa: CAPAData | null
) => {
  const doc = new jsPDF()
  const title = "PHARMACEUTICAL QMS CUSTOMER COMPLAINT AUDIT REPORT"
  const subTitle = "Compliance: FDA 21 CFR Part 211.198 | EU GMP Chapter 8 | ICH Q9"

  // Header Banner
  doc.setFillColor(30, 58, 138) // Deep blue
  doc.rect(0, 0, 210, 24, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text("AIVOA PHARMACEUTICAL QUALITY ASSURANCE MODULE", 14, 11)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text("CONFIDENTIAL QUALITY MANAGEMENT SYSTEM (QMS) AUDIT RECORD", 14, 18)

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 34)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(subTitle, 14, 40)

  // Section 1 & 2 Table: Product & Customer Metadata
  autoTable(doc, {
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    head: [['Section 1: Product & Batch Identification', 'Section 2: Customer & Origin Details']],
    body: [
      [`Product Name: ${formData.product_name || 'N/A'}`, `Customer Name: ${formData.customer_name || 'N/A'}`],
      [`Product Strength/Grade: ${formData.product_grade || 'Standard'}`, `Complaint Source: ${formData.complaint_source || 'Direct Intake'}`],
      [`Batch/Lot Number: ${formData.batch_number || 'N/A'}`, `Complaint Date: ${formData.complaint_date || new Date().toISOString().split('T')[0]}`],
      [`Mfg Date: ${formData.mfg_date || 'N/A'} | Exp Date: ${formData.exp_date || 'N/A'}`, `Initial Severity: ${formData.severity || 'Major'}`],
      [`Quantity Affected: ${formData.quantity_affected || 'N/A'}`, `Priority: ${formData.priority || 'Medium'} | Status: ${formData.status || 'Pending Triage'}`]
    ]
  })

  // Complaint Description
  let currentY = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text("Section 3: Detailed Complaint Description", 14, currentY)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const splitDesc = doc.splitTextToSize(formData.description || 'No detailed description provided.', 180)
  doc.text(splitDesc, 14, currentY + 5)
  currentY += (splitDesc.length * 4) + 8

  // Risk Assessment
  if (risk) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      head: [['AI Copilot Quality Risk Assessment & Regulatory Triage', 'Calculated Metrics']],
      body: [
        [`Risk Priority Number (RPN): ${risk.rpn}`, `Severity (S): ${risk.severity_score}/10 | Occurrence (O): ${risk.occurrence_score}/10 | Detection (D): ${risk.detection_score}/10`],
        [`Health Hazard Classification: ${risk.health_hazard_class}`, `Risk Level: ${risk.risk_level}`],
        [`Regulatory Reporting Mandate: ${risk.regulatory_reporting}`, `Patient Risk: ${risk.patient_risk_evaluation}`]
      ]
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // Root Cause & 5 Whys
  if (rootCause) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      head: [['Ishikawa Root Cause Analysis (5M1E)', '5-Whys Deductive Synthesis']],
      body: [
        [`Primary Hypothesis:\n${rootCause.primary_hypothesis}`, `Five Whys Chain:\n${rootCause.five_whys?.slice(0, 3).join('\n') || 'Under investigation'}`],
        [`Machine: ${rootCause.fishbone?.Machine || 'N/A'}\nMaterial: ${rootCause.fishbone?.Material || 'N/A'}`, `Method: ${rootCause.fishbone?.Method || 'N/A'}\nEnvironment: ${rootCause.fishbone?.Environment || 'N/A'}`]
      ]
    })
    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // CAPA Plan
  if (capa && currentY < 230) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      head: [['Immediate Containment & CAPA Plan', 'Target Date & Assignee']],
      body: [
        [`Containment Action:\n${capa.containment}`, 'Day 0 Containment Protocol'],
        [`Corrective Action:\n${capa.corrective_actions?.[0]?.action || 'N/A'}`, `Assignee: ${capa.corrective_actions?.[0]?.assignee || 'QA'} (Due: ${capa.corrective_actions?.[0]?.target_date || 'N/A'})`],
        [`Preventive Action:\n${capa.preventive_actions?.[0]?.action || 'N/A'}`, `Assignee: ${capa.preventive_actions?.[0]?.assignee || 'QA'} (Due: ${capa.preventive_actions?.[0]?.target_date || 'N/A'})`]
      ]
    })
  }

  // Footer Sign-off
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated by AIVOA AI QMS • Batch: ${formData.batch_number || 'N/A'} • Timestamp: ${new Date().toISOString()}`, 14, pageHeight - 10)
  doc.text("Authorized QA Signature: ___________________________    Date: ______________", 110, pageHeight - 10)

  doc.save(`AIVOA_Complaint_Audit_${formData.batch_number || 'Record'}_${Date.now()}.pdf`)
}
