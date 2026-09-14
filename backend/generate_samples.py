import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_data")
os.makedirs(SAMPLE_DIR, exist_ok=True)

def create_samples():
    # 1. EML File: Amoxicillin Blister Packaging Failure
    eml_content = """From: "Dr. Amanda Vance, PharmD" <a.vance@stjudemedcenter.org>
To: "AIVOA Pharmaceuticals QA Customer Complaints" <complaints.qa@aivoa-pharma.com>
Date: Wed, 10 Apr 2024 09:15:30 -0400
Subject: URGENT: Defective Blister Packaging / Seal Leakage - Amoxicillin 500mg Capsules (Batch AMX-2024-019)
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

Dear Quality Assurance Team,

I am writing on behalf of the Inpatient Pharmacy Department at St. Jude Medical Center to report a significant packaging defect with your product:

Product Name: Amoxicillin 500mg Capsules
Dosage Form / Grade: USP Finished Dosage Form (FDF)
Batch / Lot Number: AMX-2024-019
Manufacturing Date: 2024-01-15
Expiry Date: 2026-01-14
Affected Quantity: 45 Blister Packs (450 Capsules) received under PO #SJ-88219.

Incident Description:
During morning unit-dose dispensing, our clinical pharmacy technicians noticed that multiple blister pockets across 45 packs exhibited incomplete heat sealing along the aluminum lidding foil edges. Upon closer inspection, several pockets had lost vacuum seal, resulting in atmospheric moisture exposure. In at least 12 blisters, the amoxicillin powder inside the transparent capsule shells had turned clumpy and displayed yellowish discoloration. 

Storage Conditions:
The carton was stored strictly in our temperature-controlled hospital drug vault at 21.5°C and 42% Relative Humidity since receipt on March 2nd, 2024.

Action Requested:
We have placed all remaining units of Batch AMX-2024-019 on immediate pharmacy quarantine. We request an immediate investigation, formal QA response, and authorization to return the defective samples for laboratory analysis.

Sincerely,
Dr. Amanda Vance, PharmD, BCPS
Lead Inpatient Pharmacy Specialist
St. Jude Medical Center, Procurement & Clinical QA Dept
Tel: +1 (555) 439-0192
Email: a.vance@stjudemedcenter.org
"""
    with open(os.path.join(SAMPLE_DIR, "complaint_amoxicillin_blister_seal_failure.eml"), "w", encoding="utf-8") as f:
        f.write(eml_content)
    print("Created amoxicillin EML sample")

    # 2. TXT File: Metformin API Discoloration
    txt_content = """CUSTOMER COMPLAINT INTAKE REPORT
Document Ref: EXT-CMP-2024-0518
Date of Report: 2024-05-18

Complainant Information:
Customer Name: Apex Global Formulations Inc. (Solid Oral Dosage Unit)
Complaint Source: Formulation Client (B2B API)
Contact Person: Dr. Rajiv Menon, VP Quality Operations
Email: r.menon@apexformulations.com

Product Identification:
Product Name: Metformin Hydrochloride API
Product Grade / Specification: Ph. Eur / USP Grade Micronized Powder
Batch Number: MET-API-884
Manufacturing Date: 2024-02-02
Expiry Date: 2028-02-01
Quantity Affected: 500 kg (20 Fiber Drums with double polyethylene liners)

Detailed Complaint Narrative:
During incoming raw material QC testing for Metformin HCl API Batch MET-API-884, our analytical chemistry team observed an off-white to pale yellowish discoloration across 4 out of 20 drums sampled. The monograph specification requires a "white or almost white crystalline powder". Furthermore, preliminary HPLC analysis of the discolored sample indicates an elevated Related Substance A impurity level of 0.18% (exceeding our release limit of NMT 0.05%). 

Initial Assessment:
We have rejected the shipment of 500 kg and issued Quarantine Notice QN-2024-411. This is categorized as a Critical quality defect impacting downstream tablet compression and patient safety. Immediate root cause investigation and replacement shipment are required.

Defective Samples:
Retained 2 x 100g sample bottles available for courier pickup to your QC testing lab.
"""
    with open(os.path.join(SAMPLE_DIR, "complaint_metformin_api_discoloration.txt"), "w", encoding="utf-8") as f:
        f.write(txt_content)
    print("Created metformin TXT sample")

    # 3. PDF File: Heparin Injectable Foreign Particulate Matter
    pdf_path = os.path.join(SAMPLE_DIR, "complaint_heparin_injectable_particulate.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155")
    )
    
    elements = []
    elements.append(Paragraph("<b>CLINICAL DEFECT & ADVERSE QUALITY REPORT</b>", title_style))
    elements.append(Paragraph("<b>Confidential - Pharmaceutical Quality Assurance Module</b>", styles['Normal']))
    elements.append(Spacer(1, 15))
    
    table_data = [
        [Paragraph("<b>Complaint Source:</b>", body_style), Paragraph("Healthcare System / Critical Care Unit", body_style)],
        [Paragraph("<b>Customer Name:</b>", body_style), Paragraph("Apollo Multi-Specialty Hospital, Oncology & ICU Wing", body_style)],
        [Paragraph("<b>Product Name:</b>", body_style), Paragraph("Heparin Sodium Injection 5000 IU/mL", body_style)],
        [Paragraph("<b>Product Grade:</b>", body_style), Paragraph("USP Sterile Injectable Solution (FDF)", body_style)],
        [Paragraph("<b>Batch/Lot Number:</b>", body_style), Paragraph("HEP-2024-551", body_style)],
        [Paragraph("<b>Manufacturing Date:</b>", body_style), Paragraph("2024-03-01", body_style)],
        [Paragraph("<b>Expiry Date:</b>", body_style), Paragraph("2026-02-28", body_style)],
        [Paragraph("<b>Quantity Affected:</b>", body_style), Paragraph("12 Vials (10 mL clear glass vials)", body_style)],
        [Paragraph("<b>Complaint Date:</b>", body_style), Paragraph("2024-06-22", body_style)],
        [Paragraph("<b>Complaint Type:</b>", body_style), Paragraph("Foreign Particulate Matter / Contamination", body_style)],
        [Paragraph("<b>Severity Assessment:</b>", body_style), Paragraph("<font color='red'><b>CRITICAL (Class I Recall Risk)</b></font>", body_style)],
        [Paragraph("<b>Priority:</b>", body_style), Paragraph("<font color='red'><b>URGENT</b></font>", body_style)],
    ]
    
    t = Table(table_data, colWidths=[150, 360])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 15))
    
    desc_p = Paragraph(
        "<b>Detailed Incident Narrative:</b><br/>"
        "During pre-administration visual inspection in the Cardiac ICU, the attending nurse observed visible dark sub-visible particles suspended in 3 sealed 10 mL vials of Heparin Sodium Injection (Batch HEP-2024-551). A second nurse inspected the remaining carton and found 9 additional vials containing black particulate shavings adhering to the meniscus and rubber stopper interface. The vials were immediately isolated prior to patient cannulation. Physical examination suggests chlorobutyl rubber stopper coring or degradation. Immediate sterile manufacturing line audit and mandatory FDA Field Alert Report notification are strongly recommended.",
        body_style
    )
    elements.append(desc_p)
    doc.build(elements)
    print("Created heparin PDF sample")

    # 4. TXT File: Atorvastatin Dissolution OOS
    oos_content = """STABILITY TESTING DEFECT NOTIFICATION
Date: 2024-07-05
From: BioQuality Analytical Testing Laboratories Inc.
Client / Customer: Walgreens National Distribution Center & Formulation Quality

Product Details:
Product Name: Atorvastatin Calcium 20mg Tablets
Product Strength / Grade: USP Film-Coated Oral Tablets (FDF)
Batch Number: ATV-2024-301
Mfg Date: 2024-01-20
Exp Date: 2026-01-19
Quantity Affected: 1,200 Commercial Bottles (90 Tablets per Bottle)
Complaint Type: Chemical / Dissolution Out of Specification (OOS)

Defect Description:
During 6-month accelerated stability testing (40°C / 75% RH), 45-minute dissolution testing in pH 6.8 phosphate buffer resulted in an average Q value of 68.4% (monograph specification requires Q >= 80% at 45 minutes). Stage 2 (S2) testing with 6 additional units confirmed dissolution failure with mean 70.1%. Suspected excessive lubricant blending time causing hydrophobic tablet granulation. 

Initial QA Classification:
Severity: Major
Priority: High
Status: Quarantine Active
"""
    with open(os.path.join(SAMPLE_DIR, "complaint_atorvastatin_dissolution_oos.txt"), "w", encoding="utf-8") as f:
        f.write(oos_content)
    print("Created atorvastatin TXT sample")

if __name__ == "__main__":
    create_samples()
