from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ComplaintFormData(BaseModel):
    complaint_source: str = ""
    customer_name: str = ""
    product_name: str = ""
    product_grade: str = ""
    batch_number: str = ""
    mfg_date: str = ""
    exp_date: str = ""
    quantity_affected: str = ""
    complaint_type: str = ""
    complaint_date: str = ""
    description: str = ""
    severity: str = "Pending"  # Critical, Major, Minor
    priority: str = "Medium"   # Urgent, High, Medium, Low

class CompletenessData(BaseModel):
    score: int = 100
    is_complete: bool = True
    missing_critical_fields: List[str] = []
    missing_recommended_fields: List[str] = []
    recommended_questions: List[str] = []
    sample_available: Optional[str] = "Unknown"
    temperature_log_available: Optional[str] = "Unknown"

class RiskAssessmentData(BaseModel):
    severity_score: int = 5
    occurrence_score: int = 5
    detection_score: int = 5
    rpn: int = 125
    risk_level: str = "Major"  # Critical, Major, Minor
    regulatory_reporting: str = "Evaluation Pending"
    health_hazard_class: str = "Class II"
    patient_risk_evaluation: str = ""
    compliance_frameworks: List[str] = ["FDA 21 CFR Part 211.198", "EU GMP Annex 1", "ICH Q9 Quality Risk Management"]

class RootCauseAnalysisData(BaseModel):
    primary_hypothesis: str = ""
    fishbone: Dict[str, str] = Field(default_factory=dict)
    five_whys: List[str] = Field(default_factory=list)
    methodology: str = "Ishikawa 5M1E + 5-Whys Method"

class CAPAItem(BaseModel):
    action: str
    assignee: str = "QA Specialist"
    target_date: str = ""
    status: str = "Pending"

class CAPAPlanData(BaseModel):
    containment: str = ""
    corrective_actions: List[CAPAItem] = []
    preventive_actions: List[CAPAItem] = []
    effectiveness_verification: str = ""

class DuplicateComplaintInfo(BaseModel):
    complaint_number: str
    product_name: str
    batch_number: str
    similarity_percentage: int
    complaint_type: str
    status: str
    matched_reason: str

class ExtractionStep(BaseModel):
    step_number: int
    title: str
    detail: str
    status: str = "completed"

class ComplaintExtractResponse(BaseModel):
    form_data: ComplaintFormData
    completeness: CompletenessData
    risk_assessment: RiskAssessmentData
    root_cause: RootCauseAnalysisData
    capa: CAPAPlanData
    duplicates: List[DuplicateComplaintInfo] = []
    summary: str = ""
    extraction_steps: List[ExtractionStep] = []
    status: str = "success"

class ComplaintExtractRequest(BaseModel):
    text: str
    source_type: str = "text" # text, email, pdf, docx
    file_name: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None

class ComplaintCreateRequest(BaseModel):
    complaint_source: str
    customer_name: str
    product_name: str
    product_grade: Optional[str] = ""
    batch_number: str
    mfg_date: Optional[str] = ""
    exp_date: Optional[str] = ""
    quantity_affected: Optional[str] = ""
    complaint_type: str
    complaint_date: str
    description: str
    severity: str
    priority: str
    status: Optional[str] = "Pending Triage"
    completeness_score: Optional[int] = 100
    rpn_score: Optional[int] = 0
    risk_assessment: Optional[Dict[str, Any]] = None
    root_cause_analysis: Optional[Dict[str, Any]] = None
    capa_plan: Optional[Dict[str, Any]] = None
    summary: Optional[str] = ""

class ComplaintResponse(BaseModel):
    id: int
    complaint_number: str
    complaint_source: str
    customer_name: str
    product_name: str
    product_grade: str
    batch_number: str
    mfg_date: str
    exp_date: str
    quantity_affected: str
    complaint_type: str
    complaint_date: str
    description: str
    severity: str
    priority: str
    status: str
    completeness_score: int
    rpn_score: int
    created_at: str

class CopilotChatRequest(BaseModel):
    message: str
    complaint_context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, str]]] = []
    api_key: Optional[str] = None
    model: Optional[str] = None

class CopilotChatResponse(BaseModel):
    reply: str
    suggested_prompts: List[str] = []
