import json
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ComplaintDB(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(50), unique=True, index=True)
    complaint_source = Column(String(100), default="")
    customer_name = Column(String(200), default="")
    product_name = Column(String(200), default="")
    product_grade = Column(String(100), default="")
    batch_number = Column(String(100), index=True, default="")
    mfg_date = Column(String(50), default="")
    exp_date = Column(String(50), default="")
    quantity_affected = Column(String(100), default="")
    complaint_type = Column(String(100), default="")
    complaint_date = Column(String(50), default="")
    description = Column(Text, default="")
    severity = Column(String(50), default="Pending")
    priority = Column(String(50), default="Medium")
    status = Column(String(50), default="Pending Triage")
    
    # AI Intelligence Fields
    completeness_score = Column(Integer, default=100)
    completeness_details = Column(Text, default="{}")
    rpn_score = Column(Integer, default=0)
    risk_assessment = Column(Text, default="{}")
    root_cause_analysis = Column(Text, default="{}")
    capa_plan = Column(Text, default="{}")
    summary = Column(Text, default="")
    
    # Audit & Metadata
    source_file_name = Column(String(255), default="")
    raw_text = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    seed_historical_data()

def seed_historical_data():
    db = SessionLocal()
    try:
        count = db.query(ComplaintDB).count()
        if count > 0:
            return
        
        seeds = [
            ComplaintDB(
                complaint_number="CC-2024-0089",
                complaint_source="Hospital Pharmacy",
                customer_name="St. Jude Medical Center, Procurement Dept",
                product_name="Amoxicillin 500mg Capsules",
                product_grade="USP Finished Dosage Form (FDF)",
                batch_number="AMX-2024-019",
                mfg_date="2024-01-15",
                exp_date="2026-01-14",
                quantity_affected="45 Blister Packs (450 Capsules)",
                complaint_type="Packaging & Seal Integrity",
                complaint_date="2024-04-10",
                description="Pharmacist noted weak sealing on aluminum-PVC blister pockets resulting in moisture ingress and partial discoloration of amoxicillin powder in capsule shells.",
                severity="Major",
                priority="High",
                status="Under Investigation",
                completeness_score=95,
                rpn_score=144,
                risk_assessment=json.dumps({
                    "severity_score": 6,
                    "occurrence_score": 4,
                    "detection_score": 6,
                    "rpn": 144,
                    "risk_level": "Major",
                    "regulatory_reporting": "MHRA / FDA 30-Day Alert required if batch-wide",
                    "health_hazard_class": "Class II Recall Risk",
                    "patient_risk_evaluation": "Moisture exposure can lead to beta-lactam ring degradation and subpotency."
                }),
                root_cause_analysis=json.dumps({
                    "primary_hypothesis": "Blister packaging line sealing roller temperature dropped below 135°C setpoint during night shift.",
                    "fishbone": {
                        "Machine": "Blistering machine rotary sealing plate thermocouple calibration drift",
                        "Material": "PVC-PVDC film thickness variation (within ±5% tolerance)",
                        "Method": "Hourly leak test protocol skipped between 02:00 and 04:00",
                        "Man": "Relief operator untrained on sealing pressure adjustments",
                        "Environment": "Packaging hall relative humidity surged to 68% RH"
                    },
                    "five_whys": [
                        "Capsules discolored inside blister -> Moisture entered pockets",
                        "Pockets not sealed -> Sealing temperature was inadequate",
                        "Temperature dropped -> Thermocouple probe was loose",
                        "Loose probe was undetected -> Temperature alarm threshold was set too wide",
                        "Alarm threshold improperly set -> Lack of SOP parameter verification after maintenance"
                    ]
                }),
                capa_plan=json.dumps({
                    "containment": "Quarantined entire remaining stock of Batch AMX-2024-019 at distributor hubs.",
                    "corrective_actions": [
                        {"action": "Re-calibrated and fastened thermocouple probes on blister line #4.", "assignee": "Lead Maintenance Eng", "target_date": "2024-04-18", "status": "Completed"},
                        {"action": "100% leak testing of all blister batches manufactured on line #4 in the same week.", "assignee": "QA Validation Lead", "target_date": "2024-04-20", "status": "In Progress"}
                    ],
                    "preventive_actions": [
                        {"action": "Implemented automated PLC interlocking shutdown if seal temperature deviates by ±3°C.", "assignee": "Automation Engineer", "target_date": "2024-05-01", "status": "Scheduled"},
                        {"action": "Re-training of all packaging operators on SOP-PKG-042.", "assignee": "Packaging QA Manager", "target_date": "2024-04-30", "status": "Scheduled"}
                    ]
                }),
                summary="Amoxicillin blister sealing defect due to packaging line thermocouple drift. Quarantine active."
            ),
            ComplaintDB(
                complaint_number="CC-2024-0094",
                complaint_source="API Formulation Client",
                customer_name="Apex Global Formulations Inc",
                product_name="Metformin Hydrochloride API",
                product_grade="Ph. Eur / USP Grade Micronized",
                batch_number="MET-API-884",
                mfg_date="2024-02-02",
                exp_date="2028-02-01",
                quantity_affected="500 kg (20 Fiber Drums)",
                complaint_type="Discoloration / Foreign Matter",
                complaint_date="2024-05-18",
                description="Incoming QC at formulation partner observed pale yellowish tint instead of crystalline white powder with elevated related substance impurity peak.",
                severity="Critical",
                priority="Urgent",
                status="CAPA Initiated",
                completeness_score=90,
                rpn_score=210,
                risk_assessment=json.dumps({
                    "severity_score": 7,
                    "occurrence_score": 5,
                    "detection_score": 6,
                    "rpn": 210,
                    "risk_level": "Critical",
                    "regulatory_reporting": "FDA 21 CFR Part 211.198 notification and Drug Master File (DMF) amendment evaluation",
                    "health_hazard_class": "Class I / II Concern",
                    "patient_risk_evaluation": "Potential thermal degradation byproduct (Related Substance A) exceeding ICH Q3A threshold."
                }),
                root_cause_analysis=json.dumps({
                    "primary_hypothesis": "Vacuum tray dryer heating fluid hot spot during crystallization solvent recovery step.",
                    "fishbone": {
                        "Machine": "Jacketed vacuum dryer hot oil thermal control valve hunting",
                        "Material": "Standard raw dimethylamine and 2-cyanoguanidine reagents verified compliant",
                        "Method": "Extended drying cycle time due to vacuum pump seal leakage",
                        "Environment": "API synthesis cleanroom Class C compliant"
                    },
                    "five_whys": [
                        "API powder yellowed -> Thermal degradation of Metformin HCl crystals",
                        "Crystals exposed to excess heat -> Vacuum dryer jacket temperature exceeded 85°C",
                        "Temperature exceeded -> Control valve failed in open position",
                        "Valve failure not alarmed -> Secondary high-temp cutoff switch disabled during maintenance",
                        "Switch disabled -> Incomplete post-maintenance re-qualification protocol"
                    ]
                }),
                capa_plan=json.dumps({
                    "containment": "Customer issued Return Material Authorization (RMA); 500 kg API recalled and quarantined in warehouse Bay-C.",
                    "corrective_actions": [
                        {"action": "Replaced pneumatic actuator on thermal oil control valve.", "assignee": "Instrumentation Eng", "target_date": "2024-05-25", "status": "Completed"}
                    ],
                    "preventive_actions": [
                        {"action": "Upgraded secondary high-temperature safety shutdown to independent SIL-2 rated sensor.", "assignee": "Plant Engineering Head", "target_date": "2024-06-15", "status": "In Progress"}
                    ]
                }),
                summary="Metformin API yellow discoloration caused by dryer thermal overshoot. 500kg quarantined; valve replaced."
            ),
            ComplaintDB(
                complaint_number="CC-2024-0102",
                complaint_source="Healthcare System",
                customer_name="Apollo Multi-Specialty Hospital, Oncology & ICU Wing",
                product_name="Heparin Sodium Injection 5000 IU/mL",
                product_grade="USP Sterile Injectable Solution (FDF)",
                batch_number="HEP-2024-551",
                mfg_date="2024-03-01",
                exp_date="2026-02-28",
                quantity_affected="12 Vials (10 mL glass vials)",
                complaint_type="Foreign Particulate Matter",
                complaint_date="2024-06-22",
                description="ICU nurse observed tiny dark elastomer particles floating inside 10mL clear glass vial before cannulation.",
                severity="Critical",
                priority="Urgent",
                status="Under Investigation",
                completeness_score=100,
                rpn_score=360,
                risk_assessment=json.dumps({
                    "severity_score": 9,
                    "occurrence_score": 4,
                    "detection_score": 10,
                    "rpn": 360,
                    "risk_level": "Critical",
                    "regulatory_reporting": "Mandatory 3-day Field Alert Report (FAR) to US FDA / CDSCO Medical Device & Injectables division",
                    "health_hazard_class": "Class I Recall Risk (Sterile Injectable Particulate)",
                    "patient_risk_evaluation": "Injectable particulate can cause capillary occlusion, embolism, or sterile inflammatory reaction in critical care patients."
                }),
                root_cause_analysis=json.dumps({
                    "primary_hypothesis": "Chlorobutyl rubber stopper coring caused by dull needle bevel and excessive crimping pressure during capping.",
                    "fishbone": {
                        "Machine": "Rotary vial capping machine capping chuck crimping torque miscalibrated",
                        "Material": "Rubber stopper lot #STP-992 chlorobutyl with silicone coating",
                        "Method": "Visual inspection lighting lux level at manual inspection station was 1800 Lux instead of 2500 Lux requirement"
                    },
                    "five_whys": [
                        "Particles found in sterile vial -> Rubber elastomer shavings inside solution",
                        "Elastomer shaved -> Crimp head applied 45 Nm torque instead of 28 Nm",
                        "Torque set too high -> Capping machine load cell drifted",
                        "Defective vials passed inspection -> Manual visual inspection line speed was 15% above validation limit",
                        "Line speed exceeded -> Supervisor attempted to meet shift quota without QA change control"
                    ]
                }),
                capa_plan=json.dumps({
                    "containment": "Immediate national freeze on distribution of Batch HEP-2024-551; reserve samples inspected 100%.",
                    "corrective_actions": [
                        {"action": "Complete recalibration of vial capping torque sensors with digital audit logging.", "assignee": "Sterile Fill QA Lead", "target_date": "2024-06-28", "status": "Completed"}
                    ],
                    "preventive_actions": [
                        {"action": "Install automated high-speed camera visual inspection system with polarimetric defect detection.", "assignee": "Capital Projects Director", "target_date": "2024-08-30", "status": "In Progress"}
                    ]
                }),
                summary="Heparin sterile injectable particulate due to over-torqued capping head. Batch quarantine & FDA Field Alert."
            ),
            ComplaintDB(
                complaint_number="CC-2024-0110",
                complaint_source="Retail Pharmacy Chain",
                customer_name="Walgreens National Distribution Center",
                product_name="Atorvastatin Calcium 20mg Tablets",
                product_grade="USP Film-Coated Tablets",
                batch_number="ATV-2024-301",
                mfg_date="2024-01-20",
                exp_date="2026-01-19",
                quantity_affected="1,200 Bottles (90 Tablets/Bottle)",
                complaint_type="Dissolution Out of Specification (OOS)",
                complaint_date="2024-07-05",
                description="Third-party stability testing laboratory reported 45-minute dissolution Q value of 68% (USP limit is Q >= 80%).",
                severity="Major",
                priority="High",
                status="Under Investigation",
                completeness_score=100,
                rpn_score=160,
                risk_assessment=json.dumps({
                    "severity_score": 8,
                    "occurrence_score": 4,
                    "detection_score": 5,
                    "rpn": 160,
                    "risk_level": "Major",
                    "regulatory_reporting": "FDA Annual Product Quality Review (PQR) log & OOS Investigation Protocol",
                    "health_hazard_class": "Class II Recall Risk",
                    "patient_risk_evaluation": "Slow dissolution leads to decreased bioavailability and sub-therapeutic statin blood levels."
                }),
                root_cause_analysis=json.dumps({
                    "primary_hypothesis": "Magnesium stearate lubricant over-blending leading to hydrophobic barrier formation on tablet granules.",
                    "fishbone": {
                        "Machine": "V-Cone Blender 1000L speed control inverter",
                        "Material": "Magnesium stearate specific surface area batch variance",
                        "Method": "Lubrication blending step ran for 12 minutes instead of 4 minutes"
                    },
                    "five_whys": [
                        "Dissolution rate slowed -> Granules coated with thick hydrophobic lubricant film",
                        "Over-lubricated -> Blending time ran 12 minutes instead of 4 minutes",
                        "Time exceeded -> Blender timer auto-cutoff relay failed",
                        "Operator did not notice -> Digital dashboard timer was obscured by mobile ladder",
                        "Failure not caught during IPC -> Disintegration test performed but dissolution test only conducted post-coating"
                    ]
                }),
                capa_plan=json.dumps({
                    "containment": "Commercial release of Batch ATV-2024-301 placed on QA hold pending re-test and bio-waiver review.",
                    "corrective_actions": [
                        {"action": "Blender timer relay replaced with dual redundant timers and sound alarm.", "assignee": "Electrical Maintenance Lead", "target_date": "2024-07-15", "status": "Completed"}
                    ],
                    "preventive_actions": [
                        {"action": "Update SOP-PRD-109 with mandatory dual-signature step for lubrication blending duration.", "assignee": "Solid Oral QA Manager", "target_date": "2024-07-25", "status": "Completed"}
                    ]
                }),
                summary="Atorvastatin dissolution OOS due to blender timer relay failure and 12-min lubricant over-blending."
            )
        ]
        
        for s in seeds:
            db.add(s)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

# Auto-initialize on module load
init_db()
