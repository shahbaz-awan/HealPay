# -*- coding: utf-8 -*-
"""
Seed CodeLibrary with common ICD-10-CM and CPT codes.
Run with:  .\venv\Scripts\python.exe seed_code_library.py
"""
import sys, os
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import CodeLibrary, Base

DB_PATH = os.path.join(os.path.dirname(__file__), "healpay.db")
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

# ─────────────────────────────────────────────────────────────────────────────
# ICD-10-CM codes  (code, short_description, long_description, category)
# ─────────────────────────────────────────────────────────────────────────────
ICD10_CODES = [
    # Infectious
    ("A09",    "Infectious gastroenteritis",       "Infectious gastroenteritis and colitis, unspecified", "Infectious"),
    ("B34.9",  "Viral infection, unspecified",      "Viral infection, unspecified", "Infectious"),
    ("J06.9",  "Acute upper respiratory infection", "Acute upper respiratory infection, unspecified", "Respiratory"),
    ("J20.9",  "Acute bronchitis",                  "Acute bronchitis, unspecified", "Respiratory"),
    ("J18.9",  "Pneumonia, unspecified",             "Pneumonia, unspecified organism", "Respiratory"),
    ("B34.2",  "Coronavirus infection",              "Coronavirus infection, unspecified", "Infectious"),
    ("A41.9",  "Sepsis, unspecified organism",       "Sepsis, unspecified organism", "Infectious"),
    # Cardiovascular
    ("I10",    "Essential (primary) hypertension",  "Essential (primary) hypertension", "Cardiovascular"),
    ("I25.10", "Atherosclerotic heart disease",     "Atherosclerotic heart disease of native coronary artery without angina", "Cardiovascular"),
    ("I50.9",  "Heart failure, unspecified",         "Heart failure, unspecified", "Cardiovascular"),
    ("I21.9",  "Acute myocardial infarction",        "Acute myocardial infarction, unspecified", "Cardiovascular"),
    ("I48.91", "Atrial fibrillation, unspecified",  "Unspecified atrial fibrillation", "Cardiovascular"),
    ("I63.9",  "Cerebral infarction (stroke)",       "Cerebral infarction, unspecified", "Cardiovascular"),
    ("R00.0",  "Tachycardia, unspecified",            "Tachycardia, unspecified", "Cardiovascular"),
    ("R07.9",  "Chest pain, unspecified",             "Chest pain, unspecified", "Cardiovascular"),
    ("R00.1",  "Bradycardia, unspecified",            "Bradycardia, unspecified", "Cardiovascular"),
    # Respiratory
    ("J45.909","Asthma, uncomplicated",              "Unspecified asthma, uncomplicated", "Respiratory"),
    ("J44.1",  "COPD with exacerbation",             "Chronic obstructive pulmonary disease with (acute) exacerbation", "Respiratory"),
    ("J44.0",  "COPD with acute lower respiratory infection", "COPD with acute lower respiratory infection", "Respiratory"),
    ("R05.9",  "Cough",                              "Cough, unspecified", "Respiratory"),
    ("R06.00", "Dyspnea, unspecified",               "Dyspnea, unspecified – shortness of breath", "Respiratory"),
    ("R06.2",  "Wheezing",                           "Wheezing", "Respiratory"),
    # Digestive / GI
    ("K21.0",  "GERD with esophagitis",              "Gastro-esophageal reflux disease with esophagitis", "Digestive"),
    ("K57.30", "Diverticulitis of large intestine",  "Diverticulosis of large intestine without perforation or abscess", "Digestive"),
    ("K92.1",  "Melena / GI bleeding",               "Melena – lower gastrointestinal bleeding", "Digestive"),
    ("K29.70", "Gastritis, unspecified",             "Gastritis, unspecified, without bleeding", "Digestive"),
    ("K56.60", "Intestinal obstruction",             "Unspecified intestinal obstruction, unspecified as to partial versus complete obstruction", "Digestive"),
    ("R10.9",  "Abdominal pain, unspecified",        "Abdominal pain, unspecified – stomach pain", "Digestive"),
    ("R11.2",  "Nausea and vomiting",                "Nausea with vomiting, unspecified", "Digestive"),
    ("K74.60", "Unspecified cirrhosis of liver",     "Unspecified cirrhosis of liver", "Digestive"),
    # Endocrine / Metabolic
    ("E11.9",  "Type 2 diabetes mellitus",           "Type 2 diabetes mellitus without complications", "Endocrine"),
    ("E10.9",  "Type 1 diabetes mellitus",           "Type 1 diabetes mellitus without complications", "Endocrine"),
    ("E78.5",  "Hyperlipidemia, unspecified",        "Hyperlipidemia, unspecified – high cholesterol", "Endocrine"),
    ("E03.9",  "Hypothyroidism, unspecified",        "Hypothyroidism, unspecified – underactive thyroid", "Endocrine"),
    ("E05.90", "Hyperthyroidism, unspecified",       "Hyperthyroidism, unspecified – overactive thyroid", "Endocrine"),
    ("E66.9",  "Obesity, unspecified",               "Obesity, unspecified – overweight", "Endocrine"),
    ("E86.0",  "Dehydration",                        "Dehydration", "Endocrine"),
    # Musculoskeletal
    ("M54.5",  "Low back pain",                      "Low back pain – lumbago", "Musculoskeletal"),
    ("M54.2",  "Cervicalgia (neck pain)",             "Cervicalgia – neck pain", "Musculoskeletal"),
    ("M17.11", "Primary osteoarthritis, right knee", "Primary osteoarthritis, right knee – knee pain", "Musculoskeletal"),
    ("M79.3",  "Panniculitis",                       "Panniculitis, unspecified – muscle pain myalgia", "Musculoskeletal"),
    ("M25.511","Pain in right shoulder",             "Pain in right shoulder", "Musculoskeletal"),
    ("M10.9",  "Gout, unspecified",                  "Gout, unspecified – joint pain swollen", "Musculoskeletal"),
    ("M35.3",  "Polymyalgia rheumatica",             "Polymyalgia rheumatica – muscle aches stiffness", "Musculoskeletal"),
    # Neurological / Mental
    ("G43.909","Migraine, unspecified",              "Migraine, unspecified, not intractable – headache", "Neurological"),
    ("R51.9",  "Headache, unspecified",               "Headache, unspecified", "Neurological"),
    ("G47.00", "Insomnia, unspecified",              "Insomnia, unspecified – sleep disorder", "Neurological"),
    ("F32.9",  "Major depressive disorder",          "Major depressive disorder, single episode, unspecified – depression", "Mental"),
    ("F41.1",  "Generalized anxiety disorder",       "Generalized anxiety disorder", "Mental"),
    ("F41.9",  "Anxiety disorder, unspecified",      "Anxiety disorder, unspecified", "Mental"),
    ("G30.9",  "Alzheimer's disease",                "Alzheimer's disease, unspecified – dementia memory loss", "Neurological"),
    ("R55",    "Syncope and collapse",               "Syncope and collapse – fainting dizziness", "Neurological"),
    ("R42",    "Dizziness and giddiness",             "Dizziness and giddiness – vertigo", "Neurological"),
    # Renal / Urinary
    ("N39.0",  "Urinary tract infection",            "Urinary tract infection, site not specified – UTI dysuria", "Renal"),
    ("N18.9",  "Chronic kidney disease, unspecified","Chronic kidney disease, unspecified", "Renal"),
    ("N20.0",  "Calculus of kidney (kidney stone)",  "Calculus of kidney – kidney stone renal colic", "Renal"),
    ("R30.0",  "Dysuria (painful urination)",        "Dysuria – painful urination burning", "Renal"),
    # Eye / ENT
    ("H66.90", "Otitis media, unspecified",          "Otitis media, unspecified, unspecified ear – ear pain earache", "ENT"),
    ("H10.30", "Conjunctivitis, unspecified",        "Unspecified conjunctivitis – pink eye", "ENT"),
    ("J32.9",  "Chronic sinusitis, unspecified",     "Chronic sinusitis, unspecified – sinus pain congestion", "ENT"),
    ("J00",    "Acute nasopharyngitis (common cold)","Acute nasopharyngitis – common cold runny nose sneezing", "ENT"),
    # Skin
    ("L50.9",  "Urticaria, unspecified",             "Urticaria, unspecified – hives allergic rash", "Skin"),
    ("L30.9",  "Dermatitis, unspecified",            "Dermatitis, unspecified – skin rash itching", "Skin"),
    ("B02.9",  "Zoster without complications",       "Zoster without complications – shingles herpes", "Skin"),
    ("L40.0",  "Psoriasis vulgaris",                 "Psoriasis vulgaris – skin plaques scaling", "Skin"),
    # General / Constitutional
    ("R50.9",  "Fever, unspecified",                 "Fever, unspecified – pyrexia high temperature", "General"),
    ("R53.83", "Fatigue, other",                     "Other fatigue – tiredness weakness lethargy", "General"),
    ("R63.0",  "Anorexia",                           "Anorexia – loss of appetite", "General"),
    ("R73.09", "Elevated blood glucose",             "Other abnormal glucose – prediabetes borderline diabetes", "General"),
    ("Z79.01", "Long-term use of anticoagulants",    "Long-term (current) use of anticoagulants – blood thinners", "General"),
    # Cancer / Neoplasm
    ("C78.00", "Metastatic carcinoma of lung",       "Secondary malignant neoplasm of unspecified lung", "Neoplasm"),
    ("C50.919","Malignant neoplasm of breast",       "Malignant neoplasm of unspecified site of unspecified female breast – breast cancer", "Neoplasm"),
    ("C61",    "Malignant neoplasm of prostate",     "Malignant neoplasm of prostate – prostate cancer", "Neoplasm"),
]

# ─────────────────────────────────────────────────────────────────────────────
# CPT codes  (code, short_description, long_description, category)
# ─────────────────────────────────────────────────────────────────────────────
CPT_CODES = [
    # Office / Outpatient Evaluation & Management
    ("99201", "New patient office visit, 10 min",        "Office or other outpatient visit, new patient, 10 minutes – brief evaluation", "E&M"),
    ("99202", "New patient office visit, 20 min",        "Office or other outpatient visit, new patient, 20 minutes – straightforward evaluation", "E&M"),
    ("99203", "New patient office visit, 30 min",        "Office or other outpatient visit, new patient, 30 minutes – low complexity", "E&M"),
    ("99204", "New patient office visit, 45 min",        "Office or other outpatient visit, new patient, 45 minutes – moderate complexity", "E&M"),
    ("99205", "New patient office visit, 60 min",        "Office or other outpatient visit, new patient, 60 minutes – high complexity", "E&M"),
    ("99211", "Established patient, minimal visit",      "Office or other outpatient visit, established patient, minimal evaluation", "E&M"),
    ("99212", "Established patient office visit, 10 min","Office or other outpatient visit, established patient, 10 minutes – straightforward", "E&M"),
    ("99213", "Established patient office visit, 20 min","Office or other outpatient visit, established patient, 20 minutes – low complexity", "E&M"),
    ("99214", "Established patient office visit, 30 min","Office or other outpatient visit, established patient, 30 minutes – moderate complexity", "E&M"),
    ("99215", "Established patient office visit, 40 min","Office or other outpatient visit, established patient, 40 minutes – high complexity", "E&M"),
    # Preventive / Annual
    ("99385", "Preventive visit, new patient 18-39",     "Initial preventive medicine, new patient, 18-39 years – annual physical", "Preventive"),
    ("99386", "Preventive visit, new patient 40-64",     "Initial preventive medicine, new patient, 40-64 years – annual physical", "Preventive"),
    ("99395", "Preventive visit, established 18-39",     "Periodic preventive medicine, established patient, 18-39 years – wellness exam", "Preventive"),
    ("99396", "Preventive visit, established 40-64",     "Periodic preventive medicine, established patient, 40-64 years – wellness exam", "Preventive"),
    # Diagnostic / Lab
    ("80053", "Comprehensive metabolic panel",           "Comprehensive metabolic panel – blood chemistry glucose kidney liver", "Lab"),
    ("85025", "Complete blood count (CBC)",              "Blood count; complete (CBC), automated – blood test", "Lab"),
    ("83036", "Hemoglobin A1c (HbA1c)",                  "Hemoglobin; glycosylated (A1C) – diabetes blood sugar control", "Lab"),
    ("82728", "Ferritin level",                          "Ferritin – iron deficiency anemia", "Lab"),
    ("84550", "Uric acid level",                         "Uric acid; blood – gout hyperuricemia", "Lab"),
    ("84443", "Thyroid stimulating hormone (TSH)",       "Thyroid stimulating hormone (TSH) – thyroid function test", "Lab"),
    ("81000", "Urinalysis, non-automated",               "Urinalysis, by dip stick or tablet reagent – urine test UTI", "Lab"),
    # Radiology
    ("71046", "Chest X-ray, 2 views",                    "Radiologic examination, chest; 2 views – chest X-ray pneumonia", "Radiology"),
    ("73030", "Shoulder X-ray, complete",                "Radiologic examination, shoulder; complete – shoulder pain", "Radiology"),
    ("73560", "Knee X-ray, 2 views",                     "Radiologic examination, knee; 2 views – knee pain arthritis", "Radiology"),
    ("74177", "CT scan abdomen and pelvis w/ contrast",  "CT abdomen and pelvis with contrast – abdominal CT scan", "Radiology"),
    # Procedures
    ("90686", "Influenza vaccine, quadrivalent",         "Influenza vaccine, quadrivalent (IIV4) – flu shot immunization", "Procedure"),
    ("90714", "Tetanus toxoid injection",                "Tetanus and diphtheria toxoids (Td) – tetanus shot", "Procedure"),
    ("96372", "Therapeutic injection, subcutaneous",     "Therapeutic, prophylactic or diagnostic injection, subcutaneous or intramuscular", "Procedure"),
    ("93000", "Electrocardiogram (ECG/EKG)",             "Electrocardiogram, routine ECG – heart rhythm chest pain palpitations", "Procedure"),
    ("99000", "Specimen handling and transport",         "Handling and/or conveyance of specimen", "Procedure"),
    ("36415", "Venipuncture, routine",                   "Collection of venous blood by venipuncture – blood draw phlebotomy", "Procedure"),
]


def seed(db):
    existing = db.query(CodeLibrary).count()
    if existing > 0:
        print(f"[SKIP] CodeLibrary already has {existing} codes. Delete them first to re-seed.")
        return

    records = []
    for code, short_desc, long_desc, category in ICD10_CODES:
        search = f"{code} {short_desc} {long_desc}".lower()
        records.append(CodeLibrary(
            code=code,
            code_type="ICD10_CM",
            short_description=short_desc,
            long_description=long_desc,
            category=category,
            search_text=search,
            is_active=True,
            billable=True,
        ))

    for code, short_desc, long_desc, category in CPT_CODES:
        search = f"{code} {short_desc} {long_desc}".lower()
        records.append(CodeLibrary(
            code=code,
            code_type="CPT",
            short_description=short_desc,
            long_description=long_desc,
            category=category,
            search_text=search,
            is_active=True,
            billable=True,
        ))

    db.bulk_save_objects(records)
    db.commit()
    print(f"[OK] Seeded {len(records)} codes  ({len(ICD10_CODES)} ICD-10 + {len(CPT_CODES)} CPT)")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
