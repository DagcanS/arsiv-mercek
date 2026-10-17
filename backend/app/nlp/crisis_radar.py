"""
Ekonomik ve Siyasal Kriz Radarı (Crisis Radar & Frequency Tracker)
Tarihsel Türk basınında kriz dönemlerinin (1994, 2001, 2008, 2018, 2021)
anahtar kelime frekanslarını, kriz eksenlerini ve yoğunluk indekslerini hesaplar.
"""

import re
from typing import Dict, Any, List

CRISIS_TAXONOMY = {
    "enflasyon": {
        "label": "Enflasyon & Hayat Pahalılığı",
        "color": "#f59e0b", # Amber
        "keywords": [
            "enflasyon", "zam", "hayat pahalılığı", "pahalılık", "fahiş fiyat",
            "tüfe", "tefe", "etiket", "çarşı pazar", "alım gücü", "asgari ücret eridi",
            "enflasyon canavarı", "hiperenflasyon", "ücret artışı"
        ],
        "weight": 1.2
    },
    "kur": {
        "label": "Döviz Kuru & Devalüasyon",
        "color": "#ef4444", # Red
        "keywords": [
            "dolar", "döviz", "devalüasyon", "kur şoku", "dolar fırladı",
            "rezerv", "merkez bankası müdahalesi", "döviz bürosu", "dolar patladı",
            "kur korumalı", "kkm", "döviz kıtlığı", "yeşil sermaye", "türk lirası eridi"
        ],
        "weight": 1.4
    },
    "faiz": {
        "label": "Faiz & Finansal Sıkışma",
        "color": "#8b5cf6", # Purple
        "keywords": [
            "gecelik faiz", "faiz", "faiz patlaması", "repo", "likidite",
            "kredi muslukları", "faiz lobisi", "borsa çöktü", "tahvil", "mevduat",
            "fonlama", "politika faizi", "cds primi"
        ],
        "weight": 1.3
    },
    "borc_imf": {
        "label": "İflas, Borç & IMF",
        "color": "#06b6d4", # Cyan
        "keywords": [
            "imf", "stand-by", "moratoryum", "konkordato", "iflas",
            "batık banka", "fon bankası", "tmsf", "dış borç", "haciz",
            "kemal derviş", "kurtarma paketi", "borç batağı", "icra"
        ],
        "weight": 1.5
    },
    "siyasi_kriz": {
        "label": "Siyasal Gerilim & Güvensizlik",
        "color": "#ec4899", # Pink
        "keywords": [
            "anayasa fırlatma", "erken seçim", "koalisyon krizi", "muhtıra",
            "hükümet istifa", "güvenoyu", "gensoru", "kapatma davası", "siyasi kriz",
            "liderler zirvesi", "çankaya krizi", "kayyum"
        ],
        "weight": 1.1
    }
}

def analyze_crisis_radar(text: str) -> Dict[str, Any]:
    """
    Verilen haber veya manşet metninde kriz boyutlarını ve yoğunluğunu tespit eder.
    """
    if not text or not text.strip():
        return {
            "crisis_score": 0.0,
            "primary_crisis": "yok",
            "category_scores": {cat: 0.0 for cat in CRISIS_TAXONOMY},
            "matched_keywords": [],
            "is_crisis_headline": False
        }
        
    normalized = text.lower()
    cat_matches = {cat: [] for cat in CRISIS_TAXONOMY}
    cat_scores = {cat: 0.0 for cat in CRISIS_TAXONOMY}
    total_matched_keywords = []
    
    for cat, meta in CRISIS_TAXONOMY.items():
        weight = meta["weight"]
        for kw in meta["keywords"]:
            if kw in normalized:
                cat_matches[cat].append(kw)
                total_matched_keywords.append(kw)
                cat_scores[cat] += weight
                
    total_signal = sum(cat_scores.values())
    
    # 0.0 - 1.0 arası kriz şiddeti
    import math
    if total_signal > 0:
        crisis_score = min(1.0, round(1.0 - math.exp(-total_signal * 0.45), 3))
    else:
        crisis_score = 0.0
        
    # En yüksek kriz kategorisini bul
    primary_crisis = "yok"
    if total_signal > 0:
        sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)
        if sorted_cats[0][1] > 0:
            primary_crisis = sorted_cats[0][0]
            
    is_crisis = crisis_score >= 0.35
    
    return {
        "crisis_score": crisis_score,
        "primary_crisis": primary_crisis,
        "category_scores": {k: round(v, 2) for k, v in cat_scores.items()},
        "category_matches": {k: v for k, v in cat_matches.items() if v},
        "matched_keywords": list(set(total_matched_keywords)),
        "is_crisis_headline": is_crisis
    }

if __name__ == "__main__":
    t1 = "Çankaya'da Anayasa kitapçığı fırlatıldı; gecelik faiz yüzde 7500'e çıktı, dolar patladı, IMF heyeti bekleniyor."
    print("Crisis analysis:", analyze_crisis_radar(t1))
