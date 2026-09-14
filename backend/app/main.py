import os
import json
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db, init_db, ComplaintDB
from .models import (
    ComplaintExtractRequest, ComplaintExtractResponse,
    ComplaintCreateRequest, ComplaintResponse,
    CopilotChatRequest, CopilotChatResponse
)
from .services.document_parser import extract_text_from_file
from .services.langgraph_agent import run_complaint_workflow
from .services.copilot_service import answer_copilot_query

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AIVOA AI-Powered Customer Complaint Management System for Pharmaceutical API & FDF QMS",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groq_model": settings.GROQ_MODEL,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==================== AI EXTRACTION & LANGGRAPH ====================
@app.post("/api/extract/file", response_model=ComplaintExtractResponse)
async def extract_complaint_file(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    model: Optional[str] = Form(None)
):
    try:
        contents = await file.read()
        raw_text, detected_type = extract_text_from_file(contents, file.filename)
        if not raw_text or len(raw_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or could not be decoded.")
            
        result = run_complaint_workflow(
            text=raw_text,
            source_type=detected_type,
            api_key=api_key,
            model=model
        )
        
        return ComplaintExtractResponse(
            form_data=result["form_data"],
            completeness=result["completeness"],
            risk_assessment=result["risk_assessment"],
            root_cause=result["root_cause"],
            capa=result["capa"],
            duplicates=result["duplicates"],
            summary=result["summary"],
            extraction_steps=result["extraction_steps"],
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File extraction error: {str(e)}")

@app.post("/api/extract/text", response_model=ComplaintExtractResponse)
async def extract_complaint_text(request: ComplaintExtractRequest):
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty.")
            
        result = run_complaint_workflow(
            text=request.text,
            source_type=request.source_type,
            api_key=request.api_key,
            model=request.model
        )
        
        return ComplaintExtractResponse(
            form_data=result["form_data"],
            completeness=result["completeness"],
            risk_assessment=result["risk_assessment"],
            root_cause=result["root_cause"],
            capa=result["capa"],
            duplicates=result["duplicates"],
            summary=result["summary"],
            extraction_steps=result["extraction_steps"],
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction error: {str(e)}")

# ==================== COPILOT INTERACTIVE CHAT ====================
@app.post("/api/copilot/chat", response_model=CopilotChatResponse)
async def copilot_chat(request: CopilotChatRequest):
    try:
        res = answer_copilot_query(
            query=request.message,
            complaint_context=request.complaint_context,
            history=request.history,
            api_key=request.api_key,
            model=request.model
        )
        return CopilotChatResponse(
            reply=res["reply"],
            suggested_prompts=res["suggested_prompts"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot error: {str(e)}")

# ==================== COMPLAINTS QMS CRUD ====================
@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ComplaintDB)
    if status and status != "All":
        query = query.filter(ComplaintDB.status == status)
    if severity and severity != "All":
        query = query.filter(ComplaintDB.severity == severity)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (ComplaintDB.complaint_number.ilike(s)) |
            (ComplaintDB.product_name.ilike(s)) |
            (ComplaintDB.batch_number.ilike(s)) |
            (ComplaintDB.customer_name.ilike(s)) |
            (ComplaintDB.complaint_type.ilike(s))
        )
    
    records = query.order_by(ComplaintDB.id.desc()).all()
    
    return [
        ComplaintResponse(
            id=r.id,
            complaint_number=r.complaint_number,
            complaint_source=r.complaint_source or "",
            customer_name=r.customer_name or "",
            product_name=r.product_name or "",
            product_grade=r.product_grade or "",
            batch_number=r.batch_number or "",
            mfg_date=r.mfg_date or "",
            exp_date=r.exp_date or "",
            quantity_affected=r.quantity_affected or "",
            complaint_type=r.complaint_type or "",
            complaint_date=r.complaint_date or "",
            description=r.description or "",
            severity=r.severity or "Major",
            priority=r.priority or "Medium",
            status=r.status or "Pending Triage",
            completeness_score=r.completeness_score or 100,
            rpn_score=r.rpn_score or 0,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
        )
        for r in records
    ]

@app.post("/api/complaints")
def create_complaint(data: ComplaintCreateRequest, db: Session = Depends(get_db)):
    year = datetime.now(timezone.utc).year
    count = db.query(ComplaintDB).count() + 1
    complaint_no = f"CC-{year}-{count:04d}"
    
    new_record = ComplaintDB(
        complaint_number=complaint_no,
        complaint_source=data.complaint_source,
        customer_name=data.customer_name,
        product_name=data.product_name,
        product_grade=data.product_grade or "",
        batch_number=data.batch_number,
        mfg_date=data.mfg_date or "",
        exp_date=data.exp_date or "",
        quantity_affected=data.quantity_affected or "",
        complaint_type=data.complaint_type,
        complaint_date=data.complaint_date,
        description=data.description,
        severity=data.severity,
        priority=data.priority,
        status=data.status or "Pending Triage",
        completeness_score=data.completeness_score or 100,
        rpn_score=data.rpn_score or 0,
        risk_assessment=json.dumps(data.risk_assessment or {}),
        root_cause_analysis=json.dumps(data.root_cause_analysis or {}),
        capa_plan=json.dumps(data.capa_plan or {}),
        summary=data.summary or ""
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "success": True,
        "message": f"Customer complaint {complaint_no} successfully logged in QMS.",
        "id": new_record.id,
        "complaint_number": complaint_no
    }

@app.get("/api/complaints/{id}")
def get_complaint_detail(id: int, db: Session = Depends(get_db)):
    r = db.query(ComplaintDB).filter(ComplaintDB.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Complaint record not found")
    
    return {
        "id": r.id,
        "complaint_number": r.complaint_number,
        "complaint_source": r.complaint_source,
        "customer_name": r.customer_name,
        "product_name": r.product_name,
        "product_grade": r.product_grade,
        "batch_number": r.batch_number,
        "mfg_date": r.mfg_date,
        "exp_date": r.exp_date,
        "quantity_affected": r.quantity_affected,
        "complaint_type": r.complaint_type,
        "complaint_date": r.complaint_date,
        "description": r.description,
        "severity": r.severity,
        "priority": r.priority,
        "status": r.status,
        "completeness_score": r.completeness_score,
        "rpn_score": r.rpn_score,
        "risk_assessment": json.loads(r.risk_assessment) if r.risk_assessment else {},
        "root_cause_analysis": json.loads(r.root_cause_analysis) if r.root_cause_analysis else {},
        "capa_plan": json.loads(r.capa_plan) if r.capa_plan else {},
        "summary": r.summary,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else ""
    }

@app.patch("/api/complaints/{id}/status")
def update_complaint_status(id: int, status: str = Query(...), db: Session = Depends(get_db)):
    r = db.query(ComplaintDB).filter(ComplaintDB.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Complaint record not found")
    r.status = status
    db.commit()
    return {"success": True, "status": status}

# ==================== PRE-SEEDED REALISTIC SAMPLES ====================
@app.get("/api/samples")
def get_sample_complaints():
    sample_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data")
    samples = []
    
    # 1. Amoxicillin EML
    amx_path = os.path.join(sample_dir, "complaint_amoxicillin_blister_seal_failure.eml")
    if os.path.exists(amx_path):
        with open(amx_path, "r", encoding="utf-8") as f:
            samples.append({
                "id": "amoxicillin_blister",
                "title": "Amoxicillin 500mg - Blister Seal Integrity Failure",
                "filename": "complaint_amoxicillin_blister_seal_failure.eml",
                "format": "EML (Email)",
                "category": "Packaging / Finished Dosage Form (FDF)",
                "content": f.read()
            })
            
    # 2. Metformin API TXT
    met_path = os.path.join(sample_dir, "complaint_metformin_api_discoloration.txt")
    if os.path.exists(met_path):
        with open(met_path, "r", encoding="utf-8") as f:
            samples.append({
                "id": "metformin_api",
                "title": "Metformin HCl API - Yellowish Discoloration & Impurity",
                "filename": "complaint_metformin_api_discoloration.txt",
                "format": "TXT (Audit Report)",
                "category": "Active Pharmaceutical Ingredient (API)",
                "content": f.read()
            })
            
    # 3. Heparin PDF
    hep_path = os.path.join(sample_dir, "complaint_heparin_injectable_particulate.pdf")
    if os.path.exists(hep_path):
        with open(hep_path, "rb") as f:
            text, _ = extract_text_from_file(f.read(), "complaint_heparin_injectable_particulate.pdf")
            samples.append({
                "id": "heparin_particulate",
                "title": "Heparin Sodium Injection - Foreign Particulate in Vials",
                "filename": "complaint_heparin_injectable_particulate.pdf",
                "format": "PDF (Clinical Defect Form)",
                "category": "Sterile Injectable (Critical FDF)",
                "content": text
            })
            
    # 4. Atorvastatin TXT
    atv_path = os.path.join(sample_dir, "complaint_atorvastatin_dissolution_oos.txt")
    if os.path.exists(atv_path):
        with open(atv_path, "r", encoding="utf-8") as f:
            samples.append({
                "id": "atorvastatin_oos",
                "title": "Atorvastatin Calcium 20mg - Dissolution Rate OOS Failure",
                "filename": "complaint_atorvastatin_dissolution_oos.txt",
                "format": "TXT (Stability Lab)",
                "category": "Solid Oral Formulation (FDF)",
                "content": f.read()
            })
            
    return samples

# ==================== QMS ANALYTICS ====================
@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total = db.query(ComplaintDB).count()
    critical = db.query(ComplaintDB).filter(ComplaintDB.severity == "Critical").count()
    major = db.query(ComplaintDB).filter(ComplaintDB.severity == "Major").count()
    minor = db.query(ComplaintDB).filter(ComplaintDB.severity == "Minor").count()
    
    pending = db.query(ComplaintDB).filter(ComplaintDB.status == "Pending Triage").count()
    investigating = db.query(ComplaintDB).filter(ComplaintDB.status == "Under Investigation").count()
    capa_active = db.query(ComplaintDB).filter(ComplaintDB.status == "CAPA Initiated").count()
    closed = db.query(ComplaintDB).filter(ComplaintDB.status == "Closed").count()
    
    return {
        "total_complaints": total,
        "by_severity": {
            "Critical": critical,
            "Major": major,
            "Minor": minor
        },
        "by_status": {
            "Pending Triage": pending,
            "Under Investigation": investigating,
            "CAPA Initiated": capa_active,
            "Closed": closed
        }
    }
