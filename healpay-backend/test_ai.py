import sys
import logging
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

logging.basicConfig(level=logging.INFO)
from app.services import index_loader
from app.services.recommendation_service import get_recommendations


def test_engine():
    print('=== Starting warm_up ===')
    index_loader.warm_up()
    
    print('=== Waiting for ready event (up to 300s) ===')
    ready = index_loader.ensure_loaded(timeout_seconds=300)
    print('Ready:', ready)
    
    status = index_loader.get_status()
    print('Status:', status)
    
    if status['is_loaded']:
        print('-----------------------------------------')
        print('ICD-10 Recommendations (chest pain):')
        results = get_recommendations('chest pain shortness of breath', 'ICD10_CM', 2)
        for r in results:
            print(f"[{r['code']}] {r['description']} (conf: {r['confidence_score']})")
            
        print('-----------------------------------------')
        print('CPT Recommendations (electrocardiogram):')
        results = get_recommendations('electrocardiogram', 'CPT', 2)
        for r in results:
            print(f"[{r['code']}] {r['description']} (conf: {r['confidence_score']})")
        print('-----------------------------------------')
    else:
        print('!!! AI ENGINE NOT LOADED !!!')

if __name__ == '__main__':
    test_engine()
