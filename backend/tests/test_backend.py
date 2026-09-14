import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.langgraph_agent import run_complaint_workflow
from app.services.document_parser import extract_text_from_file

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_get_samples():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 4
    assert any("Amoxicillin" in s["title"] for s in samples)

def test_langgraph_extraction_text():
    sample_text = """
    Customer: St. Jude Medical Center
    Product: Amoxicillin 500mg Capsules
    Batch: AMX-2024-019
    Mfg Date: 2024-01-15
    Exp Date: 2026-01-14
    Qty: 45 Blister Packs
    Issue: Blister seal failure causing yellow discoloration of capsules due to moisture ingress.
    """
    result = run_complaint_workflow(sample_text, source_type="text")
    assert "form_data" in result
    assert result["form_data"]["batch_number"] == "AMX-2024-019"
    assert "Amoxicillin" in result["form_data"]["product_name"]
    assert "completeness" in result
    assert "risk_assessment" in result
    assert "root_cause" in result
    assert "capa" in result
    assert "duplicates" in result

def test_api_complaints_crud():
    # 1. Fetch complaints list
    response = client.get("/api/complaints")
    assert response.status_code == 200
    complaints = response.json()
    assert len(complaints) >= 4

    # 2. Create new complaint
    new_payload = {
        "complaint_source": "Hospital Pharmacy",
        "customer_name": "Metro General Hospital",
        "product_name": "Paracetamol 650mg Tablets",
        "product_grade": "IP Grade FDF",
        "batch_number": "PCM-2024-999",
        "mfg_date": "2024-05-01",
        "exp_date": "2026-04-30",
        "quantity_affected": "100 Strips",
        "complaint_type": "Physical Defect / Broken Tablets",
        "complaint_date": "2024-09-14",
        "description": "Tablets observed chipped and powdered inside blister cavities.",
        "severity": "Major",
        "priority": "High",
        "status": "Pending Triage",
        "completeness_score": 90,
        "rpn_score": 120
    }
    create_res = client.post("/api/complaints", json=new_payload)
    assert create_res.status_code == 200
    assert create_res.json()["success"] is True
    created_id = create_res.json()["id"]

    # 3. Retrieve detail
    detail_res = client.get(f"/api/complaints/{created_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["batch_number"] == "PCM-2024-999"

def test_copilot_chat():
    payload = {
        "message": "What is the regulatory reporting requirement for a critical defect?",
        "complaint_context": {
            "form_data": {
                "product_name": "Heparin Sodium Injection",
                "batch_number": "HEP-2024-551",
                "severity": "Critical"
            }
        }
    }
    res = client.post("/api/copilot/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["suggested_prompts"]) > 0
