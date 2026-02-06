"""
Medical Code Recommendation Service
Uses Sentence Transformers (embeddings) for semantic similarity matching
Provides accurate, fast, and explainable code recommendations
"""
import os

# Disable TensorFlow backend to avoid Keras 3 compatibility issues
os.environ['TRANSFORMERS_NO_TF'] = '1'
os.environ['USE_TORCH'] = '1'

import numpy as np
import pickle
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging

from app.db.models import CodeLibrary, ClinicalEncounter
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecommendationService:
    """
    Embedding-based medical code recommendation service
    Features: Accurate, Fast, Professional, Explainable
    """
    
    def __init__(self):
        self.model = None
        self.code_library_icd = []  # List of ICD-10 codes
        self.code_library_cpt = []  # List of CPT codes
        self.embeddings_icd = None  # ICD-10 embeddings
        self.embeddings_cpt = None  # CPT embeddings
        self.embeddings_cache_dir = "embeddings_cache"
        
        # Create cache directory
        os.makedirs(self.embeddings_cache_dir, exist_ok=True)
        
    def load_model(self):
        """Load pre-trained medical embedding model"""
        if self.model is None:
            logger.info("Loading embedding model...")
            # Using medical domain-specific model for better accuracy
            # Options: 'pritamdeka/S-PubMedBert-MS-MARCO' or 'emilyalsentzer/Bio_ClinicalBERT'
            try:
                self.model = SentenceTransformer('pritamdeka/S-PubMedBert-MS-MARCO')
                logger.info("✓ Model loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load medical model, using general model: {e}")
                # Fallback to general model
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("✓ Fallback model loaded")
        return self.model
    
    def load_code_library(self, db: Session, force_recompute: bool = False):
        """
        Load code library and pre-compute embeddings
        Args:
            db: Database session
            force_recompute: If True, recompute embeddings even if cached
        """
        logger.info("Loading code library...")
        
        # Load codes from database
        all_codes = db.query(CodeLibrary).all()
        
        # Separate ICD and CPT codes
        self.code_library_icd = [
            {
                'id': code.id,
                'code': code.code,
                'code_type': code.code_type,
                'short_description': code.short_description,
                'long_description': code.long_description,
                'search_text': code.search_text
            }
            for code in all_codes if code.code_type == 'ICD10_CM'
        ]
        
        self.code_library_cpt = [
            {
                'id': code.id,
                'code': code.code,
                'code_type': code.code_type,
                'short_description': code.short_description,
                'long_description': code.long_description,
                'search_text': code.search_text
            }
            for code in all_codes if code.code_type == 'CPT'
        ]
        
        logger.info(f"✓ Loaded {len(self.code_library_icd)} ICD-10 codes")
        logger.info(f"✓ Loaded {len(self.code_library_cpt)} CPT codes")
        
        # Load or compute embeddings
        self._load_or_compute_embeddings(force_recompute)
    
    def _load_or_compute_embeddings(self, force_recompute: bool = False):
        """Load embeddings from cache or compute if not cached"""
        icd_cache_path = os.path.join(self.embeddings_cache_dir, 'icd_embeddings.pkl')
        cpt_cache_path = os.path.join(self.embeddings_cache_dir, 'cpt_embeddings.pkl')
        
        # Try to load from cache
        if not force_recompute and os.path.exists(icd_cache_path) and os.path.exists(cpt_cache_path):
            logger.info("Loading embeddings from cache...")
            with open(icd_cache_path, 'rb') as f:
                self.embeddings_icd = pickle.load(f)
            with open(cpt_cache_path, 'rb') as f:
                self.embeddings_cpt = pickle.load(f)
            logger.info("✓ Embeddings loaded from cache")
        else:
            # Compute embeddings
            logger.info("Computing embeddings (this may take 30-60 seconds)...")
            self.load_model()
            
            # Encode ICD-10 codes
            icd_texts = [code['search_text'] for code in self.code_library_icd]
            self.embeddings_icd = self.model.encode(icd_texts, show_progress_bar=True, batch_size=32)
            logger.info(f"✓ Computed {len(self.embeddings_icd)} ICD-10 embeddings")
            
            # Encode CPT codes
            cpt_texts = [code['search_text'] for code in self.code_library_cpt]
            self.embeddings_cpt = self.model.encode(cpt_texts, show_progress_bar=True, batch_size=32)
            logger.info(f"✓ Computed {len(self.embeddings_cpt)} CPT embeddings")
            
            # Save to cache for faster loading next time
            with open(icd_cache_path, 'wb') as f:
                pickle.dump(self.embeddings_icd, f)
            with open(cpt_cache_path, 'wb') as f:
                pickle.dump(self.embeddings_cpt, f)
            logger.info("✓ Embeddings cached to disk")
    
    def get_clinical_text(self, encounter: ClinicalEncounter) -> str:
        """
        Extract and combine clinical text from encounter
        Combines all relevant fields for better matching
        """
        text_parts = []
        
        if encounter.chief_complaint:
            text_parts.append(f"Chief Complaint: {encounter.chief_complaint}")
        if encounter.subjective_notes:
            text_parts.append(f"Subjective: {encounter.subjective_notes}")
        if encounter.objective_findings:
            text_parts.append(f"Objective: {encounter.objective_findings}")
        if encounter.assessment:
            text_parts.append(f"Assessment: {encounter.assessment}")
        if encounter.plan:
            text_parts.append(f"Plan: {encounter.plan}")
        
        return " ".join(text_parts)
    
    def _find_matching_keywords(self, clinical_text: str, code_description: str) -> List[str]:
        """
        Find matching keywords between clinical text and code description
        Used for explainability
        """
        # Simple keyword extraction for explanation
        clinical_words = set(clinical_text.lower().split())
        description_words = set(code_description.lower().split())
        
        # Find common meaningful words (filter out stop words)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                      'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
                      'during', 'patient', 'documented', 'clinical', 'encounter'}
        
        matching = (clinical_words & description_words) - stop_words
        
        # Return most relevant matches (longer words tend to be more meaningful)
        return sorted(matching, key=len, reverse=True)[:5]
    
    def get_recommendations(
        self, 
        encounter: ClinicalEncounter, 
        code_type: str = 'ICD10_CM', 
        top_n: int = 5
    ) -> List[Dict]:
        """
        Get code recommendations for a clinical encounter
        
        Args:
            encounter: ClinicalEncounter object
            code_type: 'ICD10_CM' or 'CPT'
            top_n: Number of recommendations to return
            
        Returns:
            List of recommendations with code, description, confidence, and explanation
        """
        # Ensure model and embeddings are loaded
        if self.model is None:
            self.load_model()
        
        # Get clinical text
        clinical_text = self.get_clinical_text(encounter)
        
        if not clinical_text.strip():
            logger.warning("No clinical text available for recommendations")
            return []
        
        # Encode clinical text
        query_embedding = self.model.encode([clinical_text])[0]
        
        # Select appropriate code library and embeddings
        if code_type == 'ICD10_CM':
            code_library = self.code_library_icd
            embeddings = self.embeddings_icd
        else:  # CPT
            code_library = self.code_library_cpt
            embeddings = self.embeddings_cpt
        
        if embeddings is None or len(embeddings) == 0:
            logger.error(f"No embeddings available for {code_type}")
            return []
        
        # Compute cosine similarity
        query_embedding = query_embedding.reshape(1, -1)
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        
        # Get top N indices
        top_indices = np.argsort(similarities)[-top_n:][::-1]
        
        # Build recommendations with explanations
        recommendations = []
        for idx in top_indices:
            code_data = code_library[idx]
            similarity_score = float(similarities[idx])
            
            # Find matching keywords for explanation
            matching_keywords = self._find_matching_keywords(
                clinical_text, 
                code_data['search_text']
            )
            
            # Generate explanation
            explanation = self._generate_explanation(
                code_data, 
                similarity_score, 
                matching_keywords
            )
            
            recommendations.append({
                'code': code_data['code'],
                'code_type': code_data['code_type'],
                'description': code_data['short_description'],
                'confidence_score': round(similarity_score, 3),
                'explanation': explanation,
                'matched_keywords': matching_keywords[:3]  # Top 3 keywords
            })
        
        return recommendations
    
    def _generate_explanation(
        self, 
        code_data: Dict, 
        similarity_score: float, 
        keywords: List[str]
    ) -> str:
        """
        Generate human-readable explanation for why code was recommended
        Makes the system explainable and trustworthy
        """
        confidence_level = "High" if similarity_score > 0.7 else "Medium" if similarity_score > 0.5 else "Low"
        
        explanation_parts = [
            f"{confidence_level} confidence match ({similarity_score:.1%})"
        ]
        
        if keywords:
            keywords_str = ", ".join(keywords)
            explanation_parts.append(f"matching terms: {keywords_str}")
        
        return " - ".join(explanation_parts)


# Global instance (singleton pattern for efficiency)
_recommendation_service = None

def get_recommendation_service(db: Session = None) -> RecommendationService:
    """
    Get singleton instance of recommendation service
    Initializes on first call, reuses on subsequent calls (FAST)
    """
    global _recommendation_service
    
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
        if db:
            _recommendation_service.load_code_library(db)
    
    return _recommendation_service
