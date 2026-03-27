"""
Recommendation Service – Step 4 of the AI Recommendation Engine
================================================================
Implements the complete 8-step pipeline:

  Step 1  Data loading        ← data_pipeline.py
  Step 2  Text preprocessing  ← data_pipeline.preprocess_query()
  Step 3  Embedding lookup    ← embedding_engine + index_loader (FAISS)
  Step 4  Similarity search   ← index_loader.dense_search()  (cosine via IP)
  Step 5  Ranking layer       ← hybrid score + keyword overlap + specificity
  Step 6  Business rules      ← configurable mutual-exclusion + category cap
  Step 7  Hybrid enhancement  ← BM25 + dense weighted combination
  Step 8  Explainability      ← matched phrases, score, confidence label

All ICD/CPT knowledge comes from the CSV files – no hardcoded code values.
"""
import os

import re
import logging
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from app.services.data_pipeline import preprocess_query, tokenize_query
from app.services import index_loader

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Hybrid retrieval weights  (configurable)
# ---------------------------------------------------------------------------
DENSE_WEIGHT = 0.75   # semantic similarity weight
BM25_WEIGHT = 0.25    # keyword relevance weight
CANDIDATE_POOL = 30   # candidates fetched from each system before merge


# ---------------------------------------------------------------------------
# Business rule configuration  (data-driven, not hardcoded codes)
# ---------------------------------------------------------------------------

MAX_PER_CATEGORY_PREFIX = 2   # ICD-10 3-char prefix cap
MAX_SAME_CPT_CATEGORY = 2     # CPT category cap

MIN_CONFIDENCE_ICD = 0.10
MIN_CONFIDENCE_CPT = 0.10

# Pairs of ICD CATEGORY KEYWORDS that are mutually exclusive
MUTUALLY_EXCLUSIVE_CATEGORY_PAIRS: List[frozenset] = [
    frozenset({"type 1 diabetes", "type 2 diabetes"}),
    frozenset({"acute hepatitis", "chronic hepatitis"}),
    frozenset({"primary hypertension", "secondary hypertension"}),
]

_MATCH_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "is", "was", "are", "were", "been", "be", "have", "has",
    "had", "during", "documented", "encounter", "clinical", "patient",
    "including", "such", "as", "when", "performed", "other", "without",
    "not", "from", "by", "this", "that", "which", "its", "their", "type",
    "due", "any", "all", "each", "per", "more", "less", "than",
}


# ---------------------------------------------------------------------------
# Step 2 – Query preprocessing
# ---------------------------------------------------------------------------

def _preprocess_query(text: str) -> str:
    return preprocess_query(text)


# ---------------------------------------------------------------------------
# Steps 3 + 4 + 7 – Hybrid candidate retrieval (FAISS + BM25)
# ---------------------------------------------------------------------------

def _fetch_candidates(query_clean: str, code_type: str, pool: int = CANDIDATE_POOL) -> List[Dict]:
    dense_results = index_loader.dense_search(code_type, query_clean, top_k=pool)
    bm25_results = index_loader.bm25_search(code_type, query_clean, top_k=pool)

    merged: Dict[str, Dict] = {}
    for rec in dense_results:
        code = rec["code"]
        merged[code] = dict(rec)
        merged[code]["dense_score"] = rec.get("dense_score", 0.0)
        merged[code].setdefault("bm25_score", 0.0)

    for rec in bm25_results:
        code = rec["code"]
        if code in merged:
            merged[code]["bm25_score"] = rec.get("bm25_score", 0.0)
        else:
            entry = dict(rec)
            entry.setdefault("dense_score", 0.0)
            entry["bm25_score"] = rec.get("bm25_score", 0.0)
            merged[code] = entry

    return list(merged.values())


# ---------------------------------------------------------------------------
# Step 5 – Ranking layer
# ---------------------------------------------------------------------------

def _keyword_overlap_score(query_tokens: List[str], description: str) -> float:
    desc_tokens = set(w for w in description.lower().split() if w not in _MATCH_STOPWORDS and len(w) > 1)
    query_set = set(query_tokens)
    if not query_set or not desc_tokens:
        return 0.0
    return len(query_set & desc_tokens) / len(query_set | desc_tokens)


def _code_specificity_bonus(code: str, code_type: str) -> float:
    if code_type == "ICD10_CM":
        return min(len(code), 7) / 7 * 0.05
    return 0.02


def _compute_hybrid_score(rec: Dict, query_tokens: List[str]) -> float:
    # Check status
    status = index_loader.get_status()
    dense_available = status.get("dense_available", True)

    dense = rec.get("dense_score", 0.0)
    bm25 = rec.get("bm25_score", 0.0)
    
    if dense_available:
        hybrid = DENSE_WEIGHT * dense + BM25_WEIGHT * bm25
    else:
        # BM25-only mode: use BM25 as the primary signal
        hybrid = bm25 

    combined_desc = f"{rec.get('short_description', '')} {rec.get('long_description', '')}"
    overlap = _keyword_overlap_score(query_tokens, combined_desc)
    specificity = _code_specificity_bonus(rec["code"], rec["code_type"])
    return hybrid + 0.05 * overlap + specificity


def _rank_candidates(candidates: List[Dict], query_tokens: List[str]) -> List[Dict]:
    for rec in candidates:
        rec["hybrid_score"] = _compute_hybrid_score(rec, query_tokens)
    return sorted(candidates, key=lambda r: r["hybrid_score"], reverse=True)


# ---------------------------------------------------------------------------
# Step 6 – Business rule validation
# ---------------------------------------------------------------------------

def _icd_prefix(code: str) -> str:
    return re.sub(r"[.\-]", "", code)[:3]


def _apply_business_rules(ranked: List[Dict], code_type: str, top_n: int) -> List[Dict]:
    # Check if we are in low-memory/BM25-only mode
    dense_available = index_loader.get_status().get("dense_available", True)
    
    # If dense is missing, we relax the confidence a bit since BM25 maxes at 0.25 in hybrid mode
    # OR we use a different threshold. 0.05 is safe for BM25-only detections.
    min_conf = (MIN_CONFIDENCE_ICD if code_type == "ICD10_CM" else MIN_CONFIDENCE_CPT)
    if not dense_available:
        min_conf = 0.05  # Relax threshold for pure BM25 top candidates
        
    filtered = [r for r in ranked if r.get("hybrid_score", 0) >= min_conf]

    prefix_count: Dict[str, int] = defaultdict(int)
    category_count: Dict[str, int] = defaultdict(int)
    capped: List[Dict] = []

    for rec in filtered:
        if code_type == "ICD10_CM":
            pfx = _icd_prefix(rec["code"])
            if prefix_count[pfx] >= MAX_PER_CATEGORY_PREFIX:
                continue
            prefix_count[pfx] += 1
        else:
            cat = rec.get("category", "unknown")
            if category_count[cat] >= MAX_SAME_CPT_CATEGORY:
                continue
            category_count[cat] += 1
        capped.append(rec)

    if code_type == "ICD10_CM":
        final: List[Dict] = []
        removed_codes: set = set()
        for rec in capped:
            if rec["code"] in removed_codes:
                continue
            cat_lower = rec.get("category", "").lower()
            drop = False
            for excl_set in MUTUALLY_EXCLUSIVE_CATEGORY_PAIRS:
                if any(kw in cat_lower for kw in excl_set):
                    matching_kw = next(kw for kw in excl_set if kw in cat_lower)
                    conflict_kw = next(iter(excl_set - {matching_kw}))
                    if any(conflict_kw in r.get("category", "").lower() for r in final):
                        drop = True
                        break
            if not drop:
                final.append(rec)
        capped = final

    return capped[:top_n]


# ---------------------------------------------------------------------------
# Step 8 – Explainability
# ---------------------------------------------------------------------------

def _matched_phrases(query_tokens: List[str], description: str, max_phrases: int = 5) -> List[str]:
    desc_tokens = {w for w in description.lower().split() if w not in _MATCH_STOPWORDS and len(w) > 1}
    query_set = {w for w in query_tokens if w not in _MATCH_STOPWORDS and len(w) > 1}
    return sorted(query_set & desc_tokens, key=len, reverse=True)[:max_phrases]


def _confidence_label(score: float) -> str:
    if score >= 0.70:
        return "Very High"
    if score >= 0.55:
        return "High"
    if score >= 0.40:
        return "Moderate"
    if score >= 0.25:
        return "Low"
    return "Marginal"


def _build_explanation(rec: Dict, matched: List[str], score: float) -> str:
    label = _confidence_label(score)
    explanation = f"{label} confidence ({score:.2f})"
    if matched:
        explanation += f" – matched terms: {', '.join(matched[:3])}"
    if rec.get("category"):
        explanation += f" | Category: {rec['category']}"
    return explanation


# ---------------------------------------------------------------------------
# Step 7 + Full pipeline entry point
# ---------------------------------------------------------------------------

def get_recommendations(clinical_text: str, code_type: str = "ICD10_CM", top_n: int = 5) -> List[Dict]:
    """
    Full 8-step recommendation pipeline.
    Returns list of dicts with: code, code_type, description, confidence_score,
    explanation, matched_keywords, dense_score, bm25_score, long_description, category.
    """
    query_clean = _preprocess_query(clinical_text)
    query_tokens = tokenize_query(query_clean)

    if not query_clean.strip():
        raise ValueError("Clinical text is empty after preprocessing.")

    candidates = _fetch_candidates(query_clean, code_type, pool=CANDIDATE_POOL)
    if not candidates:
        raise ValueError(
            f"No {code_type} codes found in the index. "
            "Ensure dataset CSVs are present and the index was built successfully."
        )

    ranked = _rank_candidates(candidates, query_tokens)
    final_codes = _apply_business_rules(ranked, code_type, top_n)

    results = []
    for rec in final_codes:
        score = rec.get("hybrid_score", 0.0)
        combined_desc = f"{rec.get('short_description', '')} {rec.get('long_description', '')}"
        matched = _matched_phrases(query_tokens, combined_desc)
        results.append({
            "code": rec["code"],
            "code_type": rec["code_type"],
            "description": rec.get("short_description", ""),
            "long_description": rec.get("long_description", ""),
            "category": rec.get("category", ""),
            "confidence_score": round(score, 3),
            "dense_score": round(rec.get("dense_score", 0.0), 3),
            "bm25_score": round(rec.get("bm25_score", 0.0), 3),
            "explanation": _build_explanation(rec, matched, score),
            "matched_keywords": matched[:5],
        })

    return results


# ---------------------------------------------------------------------------
# Medical text validation
# ---------------------------------------------------------------------------

_MEDICAL_SIGNAL_WORDS = {
    "pain", "fever", "infection", "disease", "disorder", "syndrome",
    "injury", "fracture", "failure", "ache", "swelling", "bleeding",
    "cough", "nausea", "vomiting", "fatigue", "dizziness", "rash",
    "hypertension", "diabetes", "asthma", "copd", "cancer", "tumor",
    "anxiety", "depression", "seizure", "stroke", "infarction", "chest",
    "headache", "shortness", "breath", "dyspnea", "edema", "sepsis",
    "urinary", "kidney", "liver", "cardiac", "pneumonia", "bronchitis",
    "arthritis", "neuropathy", "anemia", "obesity", "malnutrition",
    "appendicitis", "cholecystitis", "pancreatitis", "colitis", "gastritis",
    "hypothyroid", "hyperthyroid", "thyroid", "allergy", "eczema",
    "numbness", "weakness", "confusion", "dementia", "alzheimer",
    "parkinson", "epilepsy", "migraine", "vertigo", "cellulitis",
    "abscess", "wound", "laceration", "burn", "trauma", "contusion",
    "sprain", "dislocation", "osteoporosis", "gout", "lupus",
}


def validate_medical_text(text: str) -> Tuple[bool, str]:
    """
    Lightweight heuristic gate for non-medical inputs.
    Returns (is_valid: bool, reason: str).
    """
    if not text or len(text.strip()) < 3:
        return False, (
            "Chief complaint is too short. Please describe the patient's "
            "symptoms or condition (minimum 3 characters)."
        )

    clean = preprocess_query(text)
    tokens = set(clean.split())

    if tokens & _MEDICAL_SIGNAL_WORDS:
        return True, ""

    if len(tokens) >= 8:
        return True, ""

    return (
        False,
        f"The complaint '{text[:80]}' does not appear to describe a medical "
        "symptom or condition. Please enter a valid clinical complaint "
        "(e.g. 'uncontrolled diabetes with neuropathy', 'chest pain and "
        "shortness of breath', 'hypertension with elevated blood pressure').",
    )


# ---------------------------------------------------------------------------
# Compatibility shim – keeps clinical.py unchanged
# ---------------------------------------------------------------------------

class RecommendationService:
    """Thin compatibility shim – all heavy lifting is in the module-level functions."""

    def get_clinical_text(self, encounter) -> str:
        parts = []
        for field in ("chief_complaint", "subjective_notes", "objective_findings", "assessment", "plan"):
            val = getattr(encounter, field, None)
            if val:
                parts.append(val)
        return " ".join(parts)

    def validate_medical_text(self, text: str) -> Tuple[bool, str]:
        return validate_medical_text(text)

    def get_recommendations(self, encounter, code_type: str = "ICD10_CM", top_n: int = 5) -> List[Dict]:
        clinical_text = self.get_clinical_text(encounter)
        if not clinical_text.strip():
            raise ValueError(
                "No clinical text available. Please fill in at least the chief complaint."
            )
        if not index_loader.is_ready():
            index_loader.warm_up()
            raise ValueError(
                "AI engine is still initializing. Please retry in a few seconds."
            )
        return get_recommendations(clinical_text=clinical_text, code_type=code_type, top_n=top_n)

    def load_code_library(self, db=None, force_recompute: bool = False):
        """No-op: library is loaded from precomputed files at startup."""
        index_loader.warm_up()


# ---------------------------------------------------------------------------
# Singleton factory (backwards-compatible)
# ---------------------------------------------------------------------------

_service_instance: Optional[RecommendationService] = None


def get_recommendation_service(db=None) -> RecommendationService:
    """Return (or create) the singleton RecommendationService."""
    global _service_instance
    if _service_instance is None:
        _service_instance = RecommendationService()
    return _service_instance
