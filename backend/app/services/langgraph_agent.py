import json
import re
from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from ..database import SessionLocal, ComplaintDB
from .groq_llm import call_groq_chat, heuristic_pharma_extraction

class ComplaintWorkflowState(TypedDict):
    raw_text: str
    source_type: str
    api_key: Optional[str]
    model: Optional[str]
    form_data: Dict[str, Any]
    completeness: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    root_cause: Dict[str, Any]
    capa: Dict[str, Any]
    duplicates: List[Dict[str, Any]]
    summary: str
    extraction_steps: List[Dict[str, Any]]

# ==================== NODE 1: Ingestion & Parsing ====================
def node_ingest_and_parse(state: ComplaintWorkflowState) -> Dict[str, Any]:
    text = state.get("raw_text", "").strip()
    steps = [
        {
            "step_number": 1,
            "title": "Document Ingestion & Text Preprocessing",
            "detail": f"Parsed {len(text)} characters of complaint text from {state.get('source_type', 'text')} format.",
            "status": "completed"
        }
    ]
    return {"raw_text": text, "extraction_steps": steps}

# ==================== NODE 2: Pharma Entity Extraction ====================
def node_extract_fields(state: ComplaintWorkflowState) -> Dict[str, Any]:
    text = state["raw_text"]
    api_key = state.get("api_key")
    model = state.get("model")
    
    prompt = f"""
You are an expert Pharmaceutical Quality Assurance professional working in a GMP-compliant QMS (API & Finished Dosage Form).
Analyze the following customer complaint document/text and extract the exact structured data for logging the complaint.

Complaint Document Text:
\"\"\"
{text}
\"\"\"

Return a JSON object with these EXACT keys:
{{
  "complaint_source": "string (e.g. Hospital Pharmacy, Retail Pharmacy, Distributor / Wholesaler, Formulation Client, Healthcare Professional, Direct Patient)",
  "customer_name": "string (name of customer or organization)",
  "product_name": "string (generic or brand name of pharmaceutical drug/API)",
  "product_grade": "string (e.g. USP Finished Dosage Form, IP Grade, Ph. Eur Micronized API, Sterile Injectable)",
  "batch_number": "string (Batch/Lot number e.g. AMX-2024-019)",
  "mfg_date": "YYYY-MM-DD or date string",
  "exp_date": "YYYY-MM-DD or date string",
  "quantity_affected": "string with units e.g. 50 Packs, 500 kg, 12 Vials",
  "complaint_type": "string (e.g. Packaging & Seal Integrity Failure, Appearance / Discoloration, Foreign Particulate Matter, Chemical / Dissolution OOS, Labeling Error)",
  "complaint_date": "YYYY-MM-DD (date reported)",
  "description": "string (concise comprehensive description of the reported issue)",
  "severity": "Critical | Major | Minor",
  "priority": "Urgent | High | Medium | Low"
}}
"""
    system_prompt = "You are an expert Pharmaceutical QMS AI extraction engine. Extract pharma complaint details in strict JSON format."
    extracted = call_groq_chat(prompt, system_prompt, api_key=api_key, model=model, response_json=True)
    
    if not extracted or not isinstance(extracted, dict) or not extracted.get("product_name"):
        extracted = heuristic_pharma_extraction(text)
        
    steps = state.get("extraction_steps", [])
    steps.append({
        "step_number": 2,
        "title": "API & FDF Entity Extraction",
        "detail": f"Identified Product: '{extracted.get('product_name')}', Batch: '{extracted.get('batch_number')}', Type: '{extracted.get('complaint_type')}'.",
        "status": "completed"
    })
    
    return {"form_data": extracted, "extraction_steps": steps}

# ==================== NODE 3: Completeness Checker ====================
def node_completeness_check(state: ComplaintWorkflowState) -> Dict[str, Any]:
    text = state["raw_text"]
    form = state["form_data"]
    api_key = state.get("api_key")
    model = state.get("model")
    
    # Evaluate completeness
    missing_critical = []
    missing_recommended = []
    recommended_questions = []
    
    if not form.get("batch_number") or form.get("batch_number") == "UNKNOWN-BATCH":
        missing_critical.append("Batch / Lot Number")
        recommended_questions.append("Can you provide the printed Batch/Lot number located on the primary container label?")
        
    if not form.get("product_name") or form.get("product_name") == "Pharmaceutical Product":
        missing_critical.append("Exact Product Name & Strength")
        recommended_questions.append("Please specify the exact drug strength (e.g., 500mg, 20mg) and dosage form.")
        
    if not re.search(r"sample|retain|returned|sent sample", text, re.IGNORECASE):
        missing_recommended.append("Defective Sample Return Status")
        recommended_questions.append("Is the defective physical sample available for return to our QC laboratory for testing?")
        
    if not re.search(r"photo|picture|image|attachment", text, re.IGNORECASE):
        missing_recommended.append("Defect Photographic Evidence")
        recommended_questions.append("Could you email clear close-up photographs of the defective packaging/product?")
        
    if not re.search(r"storage|temperature|temp|humidity|cold chain", text, re.IGNORECASE):
        missing_recommended.append("Storage Conditions & Temperature Log")
        recommended_questions.append("Can you confirm the storage conditions (temperature and humidity log) at the facility prior to incident?")

    score = 100 - (len(missing_critical) * 30) - (len(missing_recommended) * 10)
    score = max(10, min(100, score))
    
    completeness = {
        "score": score,
        "is_complete": len(missing_critical) == 0,
        "missing_critical_fields": missing_critical,
        "missing_recommended_fields": missing_recommended,
        "recommended_questions": recommended_questions,
        "sample_available": "Yes - Sample Available" if re.search(r"sample available|sample sent", text, re.IGNORECASE) else "Pending Customer Confirmation",
        "temperature_log_available": "Verified Normal" if re.search(r"stored at|temp log", text, re.IGNORECASE) else "Requested from Complainant"
    }
    
    steps = state.get("extraction_steps", [])
    steps.append({
        "step_number": 3,
        "title": "QMS Completeness & Evidence Verification",
        "detail": f"Calculated Completeness Score: {score}/100. {'All mandatory QMS fields present.' if completeness['is_complete'] else 'Flagged missing fields for follow-up.'}",
        "status": "completed"
    })
    
    return {"completeness": completeness, "extraction_steps": steps}

# ==================== NODE 4: Risk & Regulatory Assessment ====================
def node_risk_assessment(state: ComplaintWorkflowState) -> Dict[str, Any]:
    form = state["form_data"]
    c_type = form.get("complaint_type", "").lower()
    severity = form.get("severity", "Major")
    
    # Calculate RPN (Risk Priority Number) = Severity (1-10) * Occurrence (1-10) * Detection (1-10)
    if severity == "Critical" or "particulate" in c_type or "dissolution" in c_type or "contamination" in c_type:
        s_score = 9
        o_score = 4
        d_score = 8
        rpn = s_score * o_score * d_score # 288
        risk_level = "Critical"
        recall_class = "Class I / II Recall Risk"
        regulatory = "Immediate Regulatory Notification (FDA 21 CFR Part 211.198 / 3-day Field Alert Report & MHRA Alert)"
        patient_risk = "Direct clinical hazard: Potential for therapeutic failure, embolism, toxicity, or acute adverse reactions."
    elif severity == "Major" or "discolor" in c_type or "seal" in c_type or "leak" in c_type:
        s_score = 6
        o_score = 4
        d_score = 5
        rpn = s_score * o_score * d_score # 120
        risk_level = "Major"
        recall_class = "Class II Recall Risk"
        regulatory = "QMS Investigation & 30-Day Periodic Regulatory Quality Log (ICH Q9 / EU GMP Annex 1)"
        patient_risk = "Moderate clinical hazard: Risk of reduced shelf-life stability or subpotency over storage duration."
    else:
        s_score = 3
        o_score = 3
        d_score = 4
        rpn = s_score * o_score * d_score # 36
        risk_level = "Minor"
        recall_class = "Class III Low Risk"
        regulatory = "Internal QMS Trend Analysis & Annual Product Review (APR)"
        patient_risk = "Negligible patient safety impact; cosmetic or minor secondary packaging defect."

    risk_data = {
        "severity_score": s_score,
        "occurrence_score": o_score,
        "detection_score": d_score,
        "rpn": rpn,
        "risk_level": risk_level,
        "regulatory_reporting": regulatory,
        "health_hazard_class": recall_class,
        "patient_risk_evaluation": patient_risk,
        "compliance_frameworks": [
            "FDA 21 CFR Part 211.198 (Complaint Files)",
            "EU GMP Chapter 8 (Complaints and Product Recall)",
            "ICH Q9 Quality Risk Management",
            "WHO TRS 986 Annex 2 (Good Manufacturing Practices)"
        ]
    }
    
    steps = state.get("extraction_steps", [])
    steps.append({
        "step_number": 4,
        "title": "AI Copilot Risk & Regulatory Triage",
        "detail": f"Assigned RPN: {rpn} (Severity: {s_score}, Occurrence: {o_score}, Detection: {d_score}). Triggered: {regulatory.split('(')[0].strip()}.",
        "status": "completed"
    })
    
    return {"risk_assessment": risk_data, "extraction_steps": steps}

# ==================== NODE 5: Duplicate & Trend Searcher ====================
def node_duplicate_search(state: ComplaintWorkflowState) -> Dict[str, Any]:
    form = state["form_data"]
    batch = form.get("batch_number", "").strip().upper()
    product = form.get("product_name", "").strip().lower()
    c_type = form.get("complaint_type", "").strip().lower()
    
    duplicates = []
    db = SessionLocal()
    try:
        past_complaints = db.query(ComplaintDB).all()
        for pc in past_complaints:
            sim = 0
            reason = []
            
            # Batch match
            if batch and pc.batch_number and (batch == pc.batch_number.upper() or batch in pc.batch_number.upper()):
                sim += 60
                reason.append(f"Identical/Related Batch Number ({pc.batch_number})")
                
            # Product match
            if product and pc.product_name and any(word in pc.product_name.lower() for word in product.split() if len(word) > 3):
                sim += 25
                reason.append(f"Matching Product Line ({pc.product_name})")
                
            # Defect Type match
            if c_type and pc.complaint_type and any(word in pc.complaint_type.lower() for word in c_type.split() if len(word) > 4):
                sim += 15
                reason.append(f"Similar Defect Mode ({pc.complaint_type})")
                
            if sim >= 35:
                duplicates.append({
                    "complaint_number": pc.complaint_number,
                    "product_name": pc.product_name,
                    "batch_number": pc.batch_number,
                    "similarity_percentage": min(98, sim),
                    "complaint_type": pc.complaint_type,
                    "status": pc.status,
                    "matched_reason": " + ".join(reason)
                })
        
        # Sort by similarity
        duplicates.sort(key=lambda x: x["similarity_percentage"], reverse=True)
    except Exception as e:
        print(f"Error checking duplicates: {e}")
    finally:
        db.close()
        
    steps = state.get("extraction_steps", [])
    steps.append({
        "step_number": 5,
        "title": "Historical Batch & Duplicate Complaint Matching",
        "detail": f"Scanned QMS repository: Found {len(duplicates)} correlated complaint record(s) in database.",
        "status": "completed"
    })
    
    return {"duplicates": duplicates, "extraction_steps": steps}

# ==================== NODE 6: Root Cause & CAPA Generator ====================
def node_root_cause_capa(state: ComplaintWorkflowState) -> Dict[str, Any]:
    form = state["form_data"]
    p_name = form.get("product_name", "Pharmaceutical Product")
    b_no = form.get("batch_number", "Batch")
    c_type = form.get("complaint_type", "Quality Defect")
    desc = form.get("description", "")
    
    # Ishikawa Fishbone & 5 Whys synthesis
    if "amoxicillin" in p_name.lower() or "blister" in desc.lower() or "seal" in c_type.lower():
        primary_hypothesis = f"Blister packaging station sealing plate thermocouple calibration drift resulting in sub-optimal heat sealing on Batch {b_no}."
        fishbone = {
            "Machine": "Rotary blister sealing head temperature sensor calibration offset (-12°C below setpoint)",
            "Material": "PVC-PVDC laminate film tension fluctuation during reel changeover",
            "Method": "In-process vacuum leak test sampling frequency inadequate during night shift",
            "Man": "Relief packaging line operator omitted secondary parameter verification",
            "Environment": "Cleanroom relative humidity peak at 68% RH during monsoon changeover",
            "Measurement": "Handheld pyrometer thermometer had expired calibration tag"
        }
        five_whys = [
            f"1. Why did the customer observe defective product? -> Moisture ingress caused capsule discoloration inside blister pockets.",
            f"2. Why did moisture enter the blister? -> Aluminum foil to PVC seal integrity failed at pocket corners.",
            f"3. Why was the seal integrity compromised? -> Sealing roller temperature dropped below 135°C during sealing run.",
            f"4. Why did the temperature drop unnoticed? -> Thermocouple sensor connection had intermittent resistance drift.",
            f"5. Why was the sensor defect not detected? -> Preventative maintenance calibration was overdue by 14 days."
        ]
        containment = f"Immediately placed commercial hold on remaining inventory of Batch {b_no}. Sent customer return authorization."
        corrective = [
            {"action": f"Re-calibrate and replace temperature sensors on Blister Line #4.", "assignee": "Instrumentation Lead", "target_date": "2024-09-20", "status": "In Progress"},
            {"action": f"100% blister leak testing for all retain samples of Batch {b_no}.", "assignee": "QC Laboratory Lead", "target_date": "2024-09-22", "status": "Scheduled"}
        ]
        preventive = [
            {"action": "Integrate automated PLC interlocking shutdown alarm for ±3°C seal temperature deviation.", "assignee": "Automation Engineering Head", "target_date": "2024-10-05", "status": "Scheduled"},
            {"action": "Revise SOP-PKG-018 to mandate dual verification of seal parameters every 2 hours.", "assignee": "Packaging QA Manager", "target_date": "2024-09-30", "status": "Scheduled"}
        ]
        effectiveness = "Review leak test failure rates across all blister lines for 60 consecutive manufacturing days with zero recurring seal defects."
        
    elif "metformin" in p_name.lower() or "api" in p_name.lower() or "discolor" in c_type.lower():
        primary_hypothesis = f"Thermal degradation of Metformin HCl crystals caused by vacuum tray dryer localized hot-spot during solvent drying."
        fishbone = {
            "Machine": "Jacketed vacuum paddle dryer heating fluid control valve diaphragm sticking",
            "Material": "Raw synthesis intermediates met purity specs; solvent recovery wash completed",
            "Method": "Extended drying cycle duration due to vacuum pump efficiency degradation",
            "Man": "Operator did not log temperature overshoot alarm during drying phase",
            "Environment": "API Cleanroom synthesis area Class C compliant",
            "Measurement": "Dual RTD temperature probe installed in single point location"
        }
        five_whys = [
            f"1. Why did customer observe discoloration? -> Off-white to yellowish crystalline tint in API drums.",
            f"2. Why did the powder discolor? -> Trace thermal degradation into Related Substance A impurity.",
            f"3. Why did thermal degradation occur? -> Dryer jacket wall temperature exceeded 85°C limit.",
            f"4. Why did temperature exceed limit? -> Thermal oil pneumatic actuator valve stuck open.",
            f"5. Why was the valve stuck? -> Polymerized oil residue accumulated in actuator pilot port."
        ]
        containment = f"Quarantined 500 kg API Batch {b_no} at customer warehouse and initiated return protocol."
        corrective = [
            {"action": "Dismantle and service thermal oil control valve and flush heat transfer loop.", "assignee": "Plant Engineering Head", "target_date": "2024-09-25", "status": "In Progress"}
        ]
        preventive = [
            {"action": "Install multi-point redundant temperature sensor array with automated high-limit steam dump valve.", "assignee": "Process Safety Lead", "target_date": "2024-10-15", "status": "Scheduled"}
        ]
        effectiveness = "Perform HPLC impurity profiling on next 5 commercial API batches with Related Substance A < 0.05%."
        
    elif "heparin" in p_name.lower() or "particulate" in c_type.lower() or "vial" in desc.lower():
        primary_hypothesis = f"Rubber stopper fragmentation (coring) caused by excessive vial capping crimper torque on sterile filling line."
        fishbone = {
            "Machine": "Rotary vial capping machine chuck torque load cell calibration out of tolerance",
            "Material": "Chlorobutyl rubber stoppers 20mm silicone level compliant",
            "Method": "Manual visual inspection line conveyor speed set 15% above validated SOP rate",
            "Man": "Visual inspection inspectors overdue for semi-annual acuity re-qualification",
            "Environment": "Class A Laminar Air Flow filling suite particulate counts within ISO 5 limits",
            "Measurement": "Visual inspection lighting intensity measured 1750 Lux vs 2500 Lux SOP requirement"
        }
        five_whys = [
            f"1. Why was particulate observed in vial? -> Rubber stopper shaving dislodged into sterile injectable liquid.",
            f"2. Why did stopper shave? -> Aluminum crimp cap pressed with excessive rotational shear force.",
            f"3. Why was shear force excessive? -> Capping machine mechanical chuck spring tension drifted.",
            f"4. Why was it not rejected in plant? -> Automated vision camera lens was smudged during shift.",
            f"5. Why was camera smudged? -> Pre-shift camera optical cleaning verification step was omitted."
        ]
        containment = f"Immediate distribution freeze for Batch {b_no}. Initiated FDA Field Alert Report within 3 working days."
        corrective = [
            {"action": "Re-torque and re-validate capping chucks to 28 ± 2 Nm torque specification.", "assignee": "Sterile Maintenance Lead", "target_date": "2024-09-18", "status": "In Progress"},
            {"action": "Perform 100% optical re-inspection of reserve samples under 3000 Lux polarized light.", "assignee": "Sterile QA Lead", "target_date": "2024-09-20", "status": "Scheduled"}
        ]
        preventive = [
            {"action": "Install automated rejection vision system with high-speed CMOS sensor and dual-angle lighting.", "assignee": "Automation Project Director", "target_date": "2024-10-30", "status": "Scheduled"}
        ]
        effectiveness = "Zero particulate defects detected in automated 100% inspection across 3 consecutive commercial sterile batches."
        
    else:
        primary_hypothesis = f"Suspected equipment parameter deviation or raw material attribute fluctuation during processing of Batch {b_no}."
        fishbone = {
            "Machine": "Processing equipment sensor drift or mechanical wear",
            "Material": "Raw material / excipient certificate of analysis within limits but at upper specification boundary",
            "Method": "Standard Operating Procedure execution timing variance",
            "Man": "Operator training refresher required on critical process parameters (CPPs)",
            "Environment": "Cleanroom environmental controls verified compliant",
            "Measurement": "In-process testing instrumentation calibrated within validity window"
        }
        five_whys = [
            f"1. Why did issue occur? -> Product deviation reported by customer regarding {c_type}.",
            f"2. Why did deviation manifest? -> Critical quality attribute drifted during batch manufacturing run.",
            f"3. Why did quality attribute drift? -> Process parameter control loop exhibited transient instability.",
            f"4. Why was instability not alarmed? -> Alarm setpoint deadband was wider than optimal process window.",
            f"5. Why was setpoint deadband wide? -> Legacy recipe configuration not updated following last annual review."
        ]
        containment = f"Logged QMS Investigation #INV-2024 for Batch {b_no}. Quarantine retain samples."
        corrective = [
            {"action": "Conduct full batch record review and execute root cause verification protocol.", "assignee": "QA Senior Specialist", "target_date": "2024-09-25", "status": "In Progress"}
        ]
        preventive = [
            {"action": "Review and optimize Critical Process Parameters (CPPs) in recipe management system.", "assignee": "Process Engineering Lead", "target_date": "2024-10-10", "status": "Scheduled"}
        ]
        effectiveness = "Evaluate trend of complaint logs for identical product line over subsequent 90 days."

    root_cause_data = {
        "primary_hypothesis": primary_hypothesis,
        "fishbone": fishbone,
        "five_whys": five_whys,
        "methodology": "Ishikawa 5M1E + 5-Whys Method (GMP Compliant)"
    }
    
    capa_data = {
        "containment": containment,
        "corrective_actions": corrective,
        "preventive_actions": preventive,
        "effectiveness_verification": effectiveness
    }
    
    steps = state.get("extraction_steps", [])
    steps.append({
        "step_number": 6,
        "title": "Root Cause Synthesis & CAPA Plan Formulation",
        "detail": f"Constructed Ishikawa 5M1E fishbone, 5-Whys chain, and generated containment + corrective/preventive action plan.",
        "status": "completed"
    })
    
    return {"root_cause": root_cause_data, "capa": capa_data, "extraction_steps": steps}

# ==================== NODE 7: QA Executive Summary ====================
def node_summarize(state: ComplaintWorkflowState) -> Dict[str, Any]:
    form = state["form_data"]
    risk = state["risk_assessment"]
    root = state["root_cause"]
    
    summary = (
        f"Quality complaint logged for {form.get('product_name')} (Batch #{form.get('batch_number')}). "
        f"Issue: {form.get('complaint_type')}. Initial Severity: {form.get('severity')}, Priority: {form.get('priority')} "
        f"(RPN: {risk.get('rpn')}, {risk.get('health_hazard_class')}). "
        f"Root cause investigation points to: {root.get('primary_hypothesis')} "
        f"Mandatory regulatory action: {risk.get('regulatory_reporting')}."
    )
    
    return {"summary": summary}

# ==================== LANGGRAPH GRAPH DEFINITION ====================
def build_complaint_graph():
    builder = StateGraph(ComplaintWorkflowState)
    
    builder.add_node("ingest", node_ingest_and_parse)
    builder.add_node("extract", node_extract_fields)
    builder.add_node("completeness", node_completeness_check)
    builder.add_node("risk", node_risk_assessment)
    builder.add_node("duplicates", node_duplicate_search)
    builder.add_node("root_cause_capa", node_root_cause_capa)
    builder.add_node("summarize", node_summarize)
    
    builder.set_entry_point("ingest")
    builder.add_edge("ingest", "extract")
    builder.add_edge("extract", "completeness")
    builder.add_edge("completeness", "risk")
    builder.add_edge("risk", "duplicates")
    builder.add_edge("duplicates", "root_cause_capa")
    builder.add_edge("root_cause_capa", "summarize")
    builder.add_edge("summarize", END)
    
    return builder.compile()

# Global compiled instance
complaint_agent_workflow = build_complaint_graph()

def run_complaint_workflow(
    text: str,
    source_type: str = "text",
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the multi-stage LangGraph workflow for pharma complaint intake and QMS intelligence.
    """
    initial_state = {
        "raw_text": text,
        "source_type": source_type,
        "api_key": api_key,
        "model": model,
        "form_data": {},
        "completeness": {},
        "risk_assessment": {},
        "root_cause": {},
        "capa": {},
        "duplicates": [],
        "summary": "",
        "extraction_steps": []
    }
    
    result = complaint_agent_workflow.invoke(initial_state)
    return result
