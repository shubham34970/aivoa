import json
from typing import Dict, Any, List, Optional
from .groq_llm import call_groq_chat

def answer_copilot_query(
    query: str,
    complaint_context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Handles interactive QA QMS Copilot questions regarding the active complaint.
    """
    ctx_str = json.dumps(complaint_context or {}, indent=2)
    history_str = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in (history or [])[-4:]])
    
    prompt = f"""
You are the AIVOA AI QMS Copilot, an expert in pharmaceutical quality management systems, FDA 21 CFR Part 211, EU GMP Chapter 8, ICH Q9/Q10, and CAPA methodologies.

Current Complaint Context:
\"\"\"
{ctx_str}
\"\"\"

Conversation History:
{history_str}

User Question:
\"\"\"
{query}
\"\"\"

Provide a professional, clear, GMP-compliant answer tailored specifically to this pharmaceutical complaint.
Include actionable steps, regulatory citations where applicable, and best practices.
"""
    system_prompt = "You are an elite Pharmaceutical Quality Assurance & QMS Copilot. Give precise, authoritative, regulatory-sound answers."
    
    response = call_groq_chat(prompt, system_prompt, api_key=api_key, model=model, response_json=False)
    
    if not response or not isinstance(response, str):
        # Intelligent contextual fallback reply
        response = generate_heuristic_copilot_reply(query, complaint_context)
        
    suggested = [
        "What regulatory reporting deadlines apply?",
        "Generate a formal customer inquiry email for sample return.",
        "What immediate containment actions should we take for this batch?",
        "Explain the RPN score and risk classification."
    ]
    
    return {
        "reply": response,
        "suggested_prompts": suggested
    }

def generate_heuristic_copilot_reply(query: str, ctx: Optional[Dict[str, Any]]) -> str:
    q = query.lower()
    form = (ctx or {}).get("form_data", {})
    prod = form.get("product_name", "the pharmaceutical product")
    batch = form.get("batch_number", "the affected batch")
    sev = form.get("severity", "Major")
    
    if "fda" in q or "regulatory" in q or "report" in q or "mhra" in q:
        if sev == "Critical":
            return (
                f"⚠️ **Urgent Regulatory Assessment for {prod} (Batch #{batch})**:\n\n"
                f"- **FDA 21 CFR 211.198 & Field Alert Report (FAR)**: Because this is classified as a **Critical** defect involving patient safety risk, a 3-day initial Field Alert is recommended if distributed commercially in the US.\n"
                f"- **EU GMP Chapter 8**: Must be reported to National Competent Authority (NCA) / MHRA within 24-48 hours if potential recall Class I or II.\n"
                f"- **Action Required**: Convene Quality Review Board (QRB) immediately and initiate Health Hazard Evaluation (HHE)."
            )
        else:
            return (
                f"📋 **Regulatory Guidelines for {prod} (Batch #{batch})**:\n\n"
                f"- **FDA 21 CFR 211.198**: Must be investigated and documented within standard 30-day investigation window.\n"
                f"- **ICH Q9 Quality Risk Management**: Log in the Annual Product Quality Review (PQR/APQR) trend register.\n"
                f"- **Recall Status**: Currently evaluated as internal investigation; no immediate public recall trigger unless confirmed batch-wide."
            )
            
    elif "email" in q or "sample" in q or "customer" in q or "inquiry" in q:
        cust = form.get("customer_name", "Valued Customer")
        return (
            f"📧 **Draft Customer Inquiry & Sample Request Email**:\n\n"
            f"**To:** {cust}\n"
            f"**Subject:** Formal QA Follow-up: Complaint Investigation for {prod} (Batch: {batch})\n\n"
            f"Dear Team,\n\n"
            f"Thank you for notifying us regarding the quality observation on **{prod}**, Batch **{batch}**. We take product quality and patient safety with the highest level of priority.\n\n"
            f"To expedite our formal Quality Management System investigation and root cause laboratory analysis, could you please provide:\n"
            f"1. **Physical Sample Return**: Availability of retained defective units for courier collection.\n"
            f"2. **Storage Log**: Temperature and humidity log records at your facility since receipt.\n"
            f"3. **High-Resolution Photos**: Images of the primary blister/vial/drum label and affected area.\n\n"
            f"We have assigned Investigation Reference **INV-{batch}** and will share our formal 15-day investigation report upon lab completion.\n\n"
            f"Sincerely,\nQuality Assurance Department\nAIVOA Pharmaceutical Manufacturing"
        )
        
    elif "containment" in q or "action" in q or "capa" in q:
        return (
            f"🛡️ **Immediate Containment Protocol for Batch #{batch}**:\n\n"
            f"1. **Warehouse Quarantine**: Place electronic ERP lock and physical quarantine tape on all remaining stock of Batch #{batch}.\n"
            f"2. **Distribution Trace**: Pull SAP/ERP distribution report to identify all downstream hospital and pharmacy consignees.\n"
            f"3. **Retain Sample Inspection**: QC analyst to inspect 100% of retention samples under polarized lighting and stereomicroscope.\n"
            f"4. **Sister Batch Check**: Review manufacturing logs for batches produced on the same line before and after Batch #{batch}."
        )
        
    else:
        return (
            f"🔍 **AI Copilot Analysis for {prod} (Batch #{batch})**:\n\n"
            f"- **Current Severity**: {sev}\n"
            f"- **Complaint Type**: {form.get('complaint_type', 'Quality Issue')}\n"
            f"- **Next Steps**: Review the Ishikawa Root Cause Analysis and CAPA plan tabs. Ensure all missing evidence is requested from the complainant to complete the investigation file within 30 days."
        )
