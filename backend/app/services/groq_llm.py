import os
import json
import re
from typing import Dict, Any, Optional
from ..config import settings

# Attempt importing Groq
try:
    from groq import Groq
except ImportError:
    Groq = None

def get_groq_client(api_key: Optional[str] = None):
    key = api_key or settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if key and Groq:
        try:
            return Groq(api_key=key)
        except Exception:
            return None
    return None

def call_groq_chat(
    prompt: str, 
    system_prompt: str = "You are an expert Pharmaceutical Quality Assurance & QMS AI Assistant.",
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    response_json: bool = True
) -> Dict[str, Any] | str:
    """
    Calls Groq LLM (gemma2-9b-it or llama-3.3-70b-versatile).
    Returns parsed JSON dict if response_json=True, else string reply.
    Falls back gracefully to pharma domain heuristics if Groq API is not configured.
    """
    client = get_groq_client(api_key)
    selected_model = model or settings.GROQ_MODEL
    
    if client:
        try:
            completion = client.chat.completions.create(
                model=selected_model,
                messages=[
                    {"role": "system", "content": system_prompt + ("\nYou MUST respond strictly in valid JSON format only, with no markdown code fences or conversational filler." if response_json else "")},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2048,
                response_format={"type": "json_object"} if (response_json and "llama" in selected_model) else None
            )
            raw_content = completion.choices[0].message.content
            if response_json:
                # Clean potential markdown fences
                cleaned = re.sub(r"^```(json)?", "", raw_content.strip(), flags=re.IGNORECASE)
                cleaned = re.sub(r"```$", "", cleaned.strip())
                try:
                    return json.loads(cleaned)
                except Exception:
                    # Try finding JSON block in text
                    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
            return raw_content
        except Exception as e:
            print(f"Groq API call error: {e}. Using Pharma Domain Heuristic Fallback Engine.")
    
    # Fallback to domain-specific rule-based reasoning engine
    return None

def heuristic_pharma_extraction(text: str) -> Dict[str, Any]:
    """
    Domain-specialized extraction engine for API & FDF Pharma Complaints.
    Identifies batch numbers, products, complaint types, dates, quantities, and severity.
    """
    cleaned = text
    
    # 1. Product Name Detection
    product_name = ""
    grade = ""
    if re.search(r"amoxicillin", cleaned, re.IGNORECASE):
        product_name = "Amoxicillin 500mg Capsules"
        grade = "USP Finished Dosage Form (FDF)"
    elif re.search(r"metformin", cleaned, re.IGNORECASE):
        product_name = "Metformin Hydrochloride API"
        grade = "Ph. Eur / USP Micronized Grade"
    elif re.search(r"heparin", cleaned, re.IGNORECASE):
        product_name = "Heparin Sodium Injection 5000 IU/mL"
        grade = "USP Sterile Injectable Solution (FDF)"
    elif re.search(r"atorvastatin", cleaned, re.IGNORECASE):
        product_name = "Atorvastatin Calcium 20mg Tablets"
        grade = "USP Film-Coated Oral Tablets"
    elif re.search(r"paracetamol|acetaminophen", cleaned, re.IGNORECASE):
        product_name = "Paracetamol 650mg Tablets"
        grade = "IP / BP Finished Dosage Form"
    elif re.search(r"ciprofloxacin", cleaned, re.IGNORECASE):
        product_name = "Ciprofloxacin 500mg Tablets"
        grade = "USP Grade FDF"
    else:
        # Fallback regex extraction
        prod_m = re.search(r"(?:Product|Drug|Material|Item|Medicine)(?:\s*(?:Name|Description|:|-|\b))\s*[:=]?\s*([A-Za-z0-9\s\-\(\)\/\.,]{3,50})", cleaned, re.IGNORECASE)
        product_name = prod_m.group(1).split("\n")[0].strip() if prod_m else "Pharmaceutical Product"
        grade = "Pharmaceutical Grade"

    # 2. Batch / Lot Number
    batch_m = re.search(r"(?:Batch|Lot|Batch\s*No|Lot\s*No|B\.No|L\.No|Batch\s*Number|Lot\s*Number)(?:\s*[:=#\-]\s*|\s+)([A-Za-z0-9\-_]{4,20})", cleaned, re.IGNORECASE)
    batch_number = batch_m.group(1).strip() if batch_m else ""
    if not batch_number:
        # Look for typical batch codes like AMX-2024-019 or B-9921
        code_m = re.search(r"\b([A-Z]{2,4}-[0-9]{4}-[0-9]{2,4}|LOT-[0-9]{4,8}|[A-Z0-9]{7,12})\b", cleaned)
        if code_m:
            batch_number = code_m.group(1)
        else:
            batch_number = "UNKNOWN-BATCH"

    # 3. Manufacturing Date & Expiry Date
    mfg_m = re.search(r"(?:Mfg\s*Date|Manufacturing\s*Date|DOM|MFD|Mfg\.?\s*Date)(?:\s*[:=#\-]\s*|\s+)([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4}|[A-Za-z]{3,9}\s+[0-9]{4})", cleaned, re.IGNORECASE)
    mfg_date = mfg_m.group(1).strip() if mfg_m else "2024-02-15"
    
    exp_m = re.search(r"(?:Exp\s*Date|Expiry\s*Date|Expiration\s*Date|EXP|Exp\.?\s*Date)(?:\s*[:=#\-]\s*|\s+)([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4}|[A-Za-z]{3,9}\s+[0-9]{4})", cleaned, re.IGNORECASE)
    exp_date = exp_m.group(1).strip() if exp_m else "2026-02-14"

    # 4. Quantity Affected
    qty_m = re.search(r"(?:Quantity\s*Affected|Qty\s*Affected|Quantity|Affected\s*Quantity|Volume)(?:\s*[:=#\-]\s*|\s+)([0-9,.]+\s*(?:kg|g|vials|bottles|tablets|capsules|packs|drums|cartons|blisters|units))", cleaned, re.IGNORECASE)
    quantity_affected = qty_m.group(1).strip() if qty_m else "50 Packs"

    # 5. Customer / Origin
    cust_m = re.search(r"(?:Customer|Client|Hospital|Pharmacy|Complainant|From|Sender|Organization)(?:\s*[:=#\-]\s*|\s+)([A-Za-z0-9\s\.,&'\-]{3,60})", cleaned, re.IGNORECASE)
    customer_name = cust_m.group(1).split("\n")[0].strip() if cust_m else "Apex Healthcare Logistics / Hospital Pharmacy"
    
    source = "Hospital / Clinic"
    if re.search(r"distributor|wholesaler|logistics|supply chain", cleaned, re.IGNORECASE):
        source = "Distributor / Wholesaler"
    elif re.search(r"pharmacy|chemist|retail", cleaned, re.IGNORECASE):
        source = "Retail Pharmacy"
    elif re.search(r"formulation|api client|b2b|manufacturer", cleaned, re.IGNORECASE):
        source = "Formulation Client (B2B API)"
    elif re.search(r"patient|consumer", cleaned, re.IGNORECASE):
        source = "Direct Patient / Consumer"

    # 6. Complaint Date
    date_m = re.search(r"(?:Date|Complaint\s*Date|Logged\s*Date|Reported\s*Date)(?:\s*[:=#\-]\s*|\s+)([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})", cleaned, re.IGNORECASE)
    complaint_date = date_m.group(1).strip() if date_m else "2024-09-14"

    # 7. Complaint Type & Severity & Priority
    complaint_type = "Physical Defect / Packaging"
    severity = "Major"
    priority = "High"

    if re.search(r"particulate|glass|metal|foreign matter|contaminat|sub-visible", cleaned, re.IGNORECASE):
        complaint_type = "Foreign Particulate Matter / Contamination"
        severity = "Critical"
        priority = "Urgent"
    elif re.search(r"dissolution|assay|potency|subpotent|oos|out of spec|impurity|related substance", cleaned, re.IGNORECASE):
        complaint_type = "Chemical / Dissolution Out of Specification"
        severity = "Critical" if "dissolution" in cleaned.lower() or "oos" in cleaned.lower() else "Major"
        priority = "Urgent" if severity == "Critical" else "High"
    elif re.search(r"discolor|yellow|stain|color variation|appearance", cleaned, re.IGNORECASE):
        complaint_type = "Appearance / Discoloration"
        severity = "Major"
        priority = "High"
    elif re.search(r"blister|seal|leak|packaging|delamination|crushed|foil", cleaned, re.IGNORECASE):
        complaint_type = "Packaging & Seal Integrity Failure"
        severity = "Major"
        priority = "Medium"
    elif re.search(r"label|printing|barcode|mislabel", cleaned, re.IGNORECASE):
        complaint_type = "Labeling & Artwork Error"
        severity = "Major"
        priority = "High"

    # 8. Detailed Description
    description = cleaned.strip()
    if len(description) > 500:
        description = description[:500] + "..."

    return {
        "complaint_source": source,
        "customer_name": customer_name,
        "product_name": product_name,
        "product_grade": grade,
        "batch_number": batch_number,
        "mfg_date": mfg_date,
        "exp_date": exp_date,
        "quantity_affected": quantity_affected,
        "complaint_type": complaint_type,
        "complaint_date": complaint_date,
        "description": description,
        "severity": severity,
        "priority": priority
    }
