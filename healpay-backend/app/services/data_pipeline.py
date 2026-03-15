"""
Data Pipeline – Step 1 of the AI Recommendation Engine
========================================================
Responsibility:
  • Ingest ICD-10 and CPT datasets from CSV files (no hardcoded codes).
  • Normalise / clean all text.
  • Expand clinical abbreviations.
  • Produce a unified code dictionary used by both BM25 and FAISS indices.

ICD source  : Recommendation_Dataset/ICD10codes.csv   (no header, 6 cols)
CPT source  : Recommendation_Dataset/cpt_codes.csv    (has header)
"""

import csv
import hashlib
import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

# Dataset paths: try relative to this file first, then absolute container path
_DATASET_DIR = Path(__file__).resolve().parent.parent.parent / "Recommendation_Dataset"
if not _DATASET_DIR.exists():
    _DATASET_DIR = Path("/app/Recommendation_Dataset")

ICD_CSV_PATH = _DATASET_DIR / "ICD10codes.csv"
CPT_CSV_PATH = _DATASET_DIR / "cpt_codes.csv"

# ---------------------------------------------------------------------------
# Clinical abbreviation expansion table
# (All lowercase keys – applied after lowercasing input)
# ---------------------------------------------------------------------------
_ABBREV_MAP: Dict[str, str] = {
    r"\bhtn\b": "hypertension",
    r"\bdm\b": "diabetes mellitus",
    r"\bdm2\b": "type 2 diabetes mellitus",
    r"\bdm1\b": "type 1 diabetes mellitus",
    r"\bt2dm\b": "type 2 diabetes mellitus",
    r"\bt1dm\b": "type 1 diabetes mellitus",
    r"\bmi\b": "myocardial infarction",
    r"\bchf\b": "congestive heart failure",
    r"\bcopd\b": "chronic obstructive pulmonary disease",
    r"\bcad\b": "coronary artery disease",
    r"\buti\b": "urinary tract infection",
    r"\bsob\b": "shortness of breath",
    r"\bcv\b": "cardiovascular",
    r"\bgi\b": "gastrointestinal",
    r"\buri\b": "upper respiratory infection",
    r"\blbp\b": "low back pain",
    r"\bha\b": "headache",
    r"\bbp\b": "blood pressure",
    r"\bbg\b": "blood glucose",
    r"\bckd\b": "chronic kidney disease",
    r"\bpe\b": "pulmonary embolism",
    r"\bdvt\b": "deep vein thrombosis",
    r"\bafib\b": "atrial fibrillation",
    r"\baf\b": "atrial fibrillation",
    r"\bsvt\b": "supraventricular tachycardia",
    r"\bvt\b": "ventricular tachycardia",
    r"\bhf\b": "heart failure",
    r"\bjt\b": "joint",
    r"\bra\b": "rheumatoid arthritis",
    r"\bsle\b": "systemic lupus erythematosus",
    r"\bibd\b": "inflammatory bowel disease",
    r"\bcd\b": "crohn disease",
    r"\buc\b": "ulcerative colitis",
    r"\bgerd\b": "gastroesophageal reflux disease",
    r"\bpud\b": "peptic ulcer disease",
    r"\bms\b": "multiple sclerosis",
    r"\btbi\b": "traumatic brain injury",
    r"\bcva\b": "cerebrovascular accident stroke",
    r"\btia\b": "transient ischemic attack",
    r"\bptsd\b": "post traumatic stress disorder",
    r"\bgad\b": "generalized anxiety disorder",
    r"\bmdd\b": "major depressive disorder",
    r"\badhd\b": "attention deficit hyperactivity disorder",
    r"\basd\b": "autism spectrum disorder",
    r"\bpcos\b": "polycystic ovary syndrome",
    r"\bppe\b": "postpartum preeclampsia",
    r"\bhiv\b": "human immunodeficiency virus",
    r"\baids\b": "acquired immunodeficiency syndrome",
    r"\btb\b": "tuberculosis",
    r"\bca\b": "cancer carcinoma",
    r"\bnausea\b": "nausea",
    r"\bvomiting\b": "vomiting",
    r"\bfever\b": "fever pyrexia",
    r"\bpain\b": "pain",
    r"\bneuropathy\b": "neuropathy peripheral nerve damage",
    r"\bretinopathy\b": "retinopathy retinal disease",
    r"\bnephropathy\b": "nephropathy kidney disease",
    r"\bchest pain\b": "chest pain angina",
    r"\bhyperglycemia\b": "hyperglycemia elevated blood glucose",
    r"\bhypoglycemia\b": "hypoglycemia low blood glucose",
    r"\bedema\b": "edema fluid retention swelling",
    r"\bdyspnea\b": "dyspnea shortness of breath difficulty breathing",
    r"\bsyncope\b": "syncope fainting loss of consciousness",
    r"\bpalpitations\b": "palpitations irregular heartbeat",
    r"\bdizziness\b": "dizziness vertigo",
    r"\bseizure\b": "seizure convulsion epilepsy",
    r"\bweight loss\b": "weight loss cachexia",
    r"\bfatigue\b": "fatigue tiredness weakness",
    r"\banemia\b": "anemia low hemoglobin",
    r"\bthrombosis\b": "thrombosis blood clot",
    r"\bsepsis\b": "sepsis systemic infection",
    r"\bpneumonia\b": "pneumonia lung infection",
    r"\bbronchitis\b": "bronchitis airway inflammation",
    r"\basthma\b": "asthma bronchial hyperreactivity",
    r"\ballergy\b": "allergy allergic hypersensitivity",
    r"\bosteoporosis\b": "osteoporosis bone density loss",
    r"\barthritis\b": "arthritis joint inflammation",
    r"\bfracture\b": "fracture bone break",
    r"\bstroke\b": "stroke cerebrovascular accident",
    r"\binfarction\b": "infarction tissue death ischemia",
    r"\bischemia\b": "ischemia reduced blood flow",
    r"\bhypo\b": "hypothyroidism",
    r"\bhyper\b": "hyperthyroidism",
}

# ---------------------------------------------------------------------------
# Stopwords to strip from search_text (keep clinically relevant tokens)
# ---------------------------------------------------------------------------
_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "is", "was", "are", "were", "been", "be", "have", "has",
    "had", "during", "documented", "encounter", "clinical", "patient",
    "including", "such", "as", "when", "performed", "other", "than",
    "not", "from", "by", "this", "that", "which", "its", "their", "without",
    "type", "due", "any", "all", "each", "per", "more", "less",
}


# ---------------------------------------------------------------------------
# Text preprocessing helpers
# ---------------------------------------------------------------------------

def _expand_abbreviations(text: str) -> str:
    """Expand known clinical abbreviations in a lowercased string."""
    for pattern, replacement in _ABBREV_MAP.items():
        text = re.sub(pattern, replacement, text)
    return text


def _clean_text(raw: str) -> str:
    """
    Full text normalisation pipeline:
      1. Lowercase
      2. Expand abbreviations
      3. Remove special characters (keep letters, digits, spaces)
      4. Collapse whitespace
    """
    if not raw:
        return ""
    text = raw.lower().strip()
    text = _expand_abbreviations(text)
    # Remove non-alphanumeric except spaces (keep hyphens as spaces)
    text = re.sub(r"[-/\\]", " ", text)
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _build_search_text(short_desc: str, long_desc: str, category: str) -> str:
    """
    Combine and clean all fields into a single rich search token string.
    Long description gets less weight than short description in the final
    string by appearing once; short description appears twice.
    """
    parts = [
        _clean_text(short_desc),
        _clean_text(short_desc),   # doubled for weighting
        _clean_text(long_desc),
        _clean_text(category),
    ]
    combined = " ".join(p for p in parts if p)
    # Remove stopwords for BM25 tokens (but keep full text for embeddings)
    return combined


def _tokenize_for_bm25(search_text: str) -> List[str]:
    """Return stopword-filtered token list suitable for BM25 indexing."""
    return [w for w in search_text.split() if w not in _STOPWORDS and len(w) > 1]


# ---------------------------------------------------------------------------
# ICD loader
# ---------------------------------------------------------------------------

def load_icd_codes(path: Path = ICD_CSV_PATH) -> List[Dict]:
    """
    Load ICD-10-CM codes from the provided CSV.

    Expected columns (NO header row):
      0: parent_code   e.g. "A00"
      1: suffix        e.g. "0"
      2: full_code     e.g. "A000"
      3: short_desc    e.g. "Cholera due to Vibrio cholerae 01, biovar cholerae"
      4: long_desc     (same or richer)
      5: category      e.g. "Cholera"

    Returns a list of normalised code dicts.
    """
    if not path.exists():
        raise FileNotFoundError(f"ICD-10 dataset not found at: {path}")

    records: List[Dict] = []
    seen_codes: set = set()

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 6:
                continue

            full_code = row[2].strip()
            if not full_code or full_code in seen_codes:
                continue
            seen_codes.add(full_code)

            short_desc = row[3].strip()
            long_desc = row[4].strip() if len(row) > 4 else short_desc
            category = row[5].strip() if len(row) > 5 else ""

            # Skip rows where description is obviously not useful
            if len(short_desc) < 5:
                continue

            search_text = _build_search_text(short_desc, long_desc, category)
            records.append({
                "code": full_code,
                "code_type": "ICD10_CM",
                "short_description": short_desc,
                "long_description": long_desc,
                "category": category,
                "search_text": search_text,
                "bm25_tokens": _tokenize_for_bm25(search_text),
            })

    logger.info("Loaded %d ICD-10 codes from %s", len(records), path.name)
    return records


# ---------------------------------------------------------------------------
# CPT loader
# ---------------------------------------------------------------------------

def load_cpt_codes(path: Path = CPT_CSV_PATH) -> List[Dict]:
    """
    Load CPT codes from the provided CSV.

    Expected columns (WITH header row):
      code, short_description, long_description, category
    """
    if not path.exists():
        raise FileNotFoundError(f"CPT dataset not found at: {path}")

    records: List[Dict] = []
    seen_codes: set = set()

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("code", "").strip()
            if not code or code in seen_codes:
                continue
            seen_codes.add(code)

            short_desc = row.get("short_description", "").strip()
            long_desc = row.get("long_description", short_desc).strip()
            category = row.get("category", "").strip()

            if len(short_desc) < 5:
                continue

            search_text = _build_search_text(short_desc, long_desc, category)
            records.append({
                "code": code,
                "code_type": "CPT",
                "short_description": short_desc,
                "long_description": long_desc,
                "category": category,
                "search_text": search_text,
                "bm25_tokens": _tokenize_for_bm25(search_text),
            })

    logger.info("Loaded %d CPT codes from %s", len(records), path.name)
    return records


# ---------------------------------------------------------------------------
# Representative ICD sample for dense embeddings
# ---------------------------------------------------------------------------

def sample_icd_for_embedding(
    all_icd: List[Dict],
    max_codes: int = 5000,
) -> List[Dict]:
    """
    Select a representative subset of ICD codes for dense embedding.

    Strategy:
      1. Prefer codes with richer / longer descriptions (more embedding signal).
      2. Ensure category diversity: at most ~ceil(max_codes / #categories)
         codes per category.
      3. Within a category, keep codes with the longest search texts (most
         specific descriptions are more useful for semantic search).

    With 71 k ICD codes and max_codes = 5 000, this runs in under a second
    and gives near-complete category coverage.
    """
    import math
    from collections import defaultdict

    by_category: Dict[str, List[Dict]] = defaultdict(list)
    for rec in all_icd:
        by_category[rec["category"]].append(rec)

    num_categories = len(by_category)
    per_category = max(1, math.ceil(max_codes / max(num_categories, 1)))

    sampled: List[Dict] = []
    for cat_records in by_category.values():
        # Sort by description richness (longer = better for embeddings)
        cat_records_sorted = sorted(
            cat_records,
            key=lambda r: len(r["search_text"]),
            reverse=True,
        )
        sampled.extend(cat_records_sorted[:per_category])

    # Enforce hard cap
    sampled = sampled[:max_codes]
    logger.info(
        "Sampled %d ICD codes from %d categories for dense embedding (max=%d)",
        len(sampled),
        num_categories,
        max_codes,
    )
    return sampled


# ---------------------------------------------------------------------------
# Dataset hash (for cache invalidation)
# ---------------------------------------------------------------------------

def compute_dataset_hash() -> str:
    """
    Return a short hash of both dataset files.
    If any dataset changes (content or size), the hash changes and the
    embedding cache is automatically invalidated.
    """
    hasher = hashlib.md5()
    for path in (ICD_CSV_PATH, CPT_CSV_PATH):
        if path.exists():
            stat = path.stat()
            hasher.update(f"{path.name}:{stat.st_size}:{stat.st_mtime}".encode())
    return hasher.hexdigest()[:12]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_all_codes() -> Tuple[List[Dict], List[Dict], List[Dict], List[Dict]]:
    """
    Main entry point for the pipeline.

    Returns a 4-tuple:
      (all_icd, sampled_icd, all_cpt, bm25_icd)

    • all_icd      – full 71 k ICD list (used for BM25 and code lookup)
    • sampled_icd  – ~5 k representative ICD subset (used for FAISS)
    • all_cpt      – all CPT codes (used for both BM25 and FAISS)
    • bm25_icd     – alias for all_icd (kept for API clarity)
    """
    all_icd = load_icd_codes()
    sampled_icd = sample_icd_for_embedding(all_icd, max_codes=5000)
    all_cpt = load_cpt_codes()
    return all_icd, sampled_icd, all_cpt, all_icd


def preprocess_query(text: str) -> str:
    """
    Apply the same preprocessing pipeline to a user clinical note / query.
    Must mirror exactly what was applied when building search_text,
    so that BM25 and embedding lookup are consistent.
    """
    return _clean_text(text)


def tokenize_query(text: str) -> List[str]:
    """Tokenise a cleaned query string for BM25 retrieval."""
    cleaned = _clean_text(text)
    return _tokenize_for_bm25(cleaned)
