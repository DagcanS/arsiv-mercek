"""
Kutuplaşma ve Söylem Ayrışması (Polarization Index) Motoru
Türk basınında kullanılan ideolojik, ötekileştirici ve kamplaştırıcı
söylemleri tespit ederek 0.0 - 1.0 arası kutuplaşma şiddetini ölçer.
"""

import re
from typing import Dict, Any, List

# Kutuplaştırıcı & Ötekileştirici Söylem Sözlüğü
POLARIZING_MARKERS = {
    # İhanet & Düşmanlaştırma Retoriği
    "hain": 1.0, "ihanet": 0.95, "işbirlikçi": 0.9, "düşman": 0.85, "iç düşman": 1.0,
    "arkadan hançerleme": 0.95, "vatan haini": 1.0, "halk düşmanı": 0.95,
    
    # Komplo & Dış Tehdit Söylemi
    "dış güçler": 0.85, "üst akıl": 0.9, "küresel çete": 0.9, "faiz lobisi": 0.85,
    "maşa": 0.8, "kukla": 0.85, "operasyon çekiliyor": 0.8, "düğmeye basıldı": 0.75,
    "karanlık odaklar": 0.85, "kirli tezgah": 0.85, "senaryo devrede": 0.75,
    
    # İdeolojik & Siyasi Hakaret / Damgalama
    "yobaz": 0.9, "mürteci": 0.85, "gerici": 0.8, "faşist": 0.85, "darbeci": 0.9,
    "cunta": 0.85, "vesayetçi": 0.8, "bölücü": 0.9, "terör yandaşı": 0.95,
    "milli irade düşmanı": 0.9, "satılmış": 0.95, "pespaye": 0.8, "gayrimilli": 0.9,
    
    # Ekonomik Kamplaşma / Suçlama
    "vurguncu": 0.8, "fırsatçı": 0.75, "stokçu": 0.75, "karaborsacı": 0.8,
    "ekonomik tetikçi": 0.9, "ekonomik sabotaj": 0.9, "finansal terör": 0.95
}

NEWSPAPER_LEANINGS = {
    "Cumhuriyet": {"leaning": "sol_kemalist", "bias_tendency": "laiklik_kamuculuk"},
    "Sözcü": {"leaning": "kemalist_muhalif", "bias_tendency": "sert_muhalefet"},
    "Hürriyet": {"leaning": "merkez_ana_akim", "bias_tendency": "donemsel_denge"},
    "Milliyet": {"leaning": "merkez", "bias_tendency": "itidalli_ana_akim"},
    "Sabah": {"leaning": "muhafazakar_iktidar", "bias_tendency": "iktidar_savunusu"},
    "Yeni Şafak": {"leaning": "islamci_iktidar", "bias_tendency": "milli_gorus_iktidar"},
    "Dünya": {"leaning": "ekonomi_piyasa", "bias_tendency": "sektorel_reel_sektor"},
    "Tercüman": {"leaning": "milliyetci_sag", "bias_tendency": "muhafazakar_milliyetci"},
    "Akşam": {"leaning": "iktidar_yanlisi", "bias_tendency": "hukumet_destegi"}
}

def analyze_polarization(text: str, source: str = "") -> Dict[str, Any]:
    """
    Tekil bir metindeki kutuplaşma ve ötekileştirici söylem yoğunluğunu ölçer.
    """
    if not text or not text.strip():
        return {
            "score": 0.0,
            "level": "Düşük (Nötr Söylem)",
            "markers_found": [],
            "intensity": 0.0
        }
        
    normalized = text.lower()
    found_markers = []
    total_weight = 0.0
    
    # 1. Çok kelimeli kalıplar
    for marker, weight in POLARIZING_MARKERS.items():
        if " " in marker and marker in normalized:
            found_markers.append(marker)
            total_weight += weight
            
    # 2. Tek kelimeler
    words = re.findall(r'\b\w+\b', normalized)
    for w in words:
        if w in POLARIZING_MARKERS and " " not in w:
            found_markers.append(w)
            total_weight += POLARIZING_MARKERS[w]
            
    # Normalize skor (0.0 - 1.0)
    import math
    if total_weight > 0:
        # 1 marker genelde 0.35-0.5 aralığına, 3+ marker 0.85+ aralığına oturur
        score = min(1.0, 1.0 - math.exp(-total_weight * 0.7))
    else:
        score = 0.05  # Temel basın doğası gereği hafif arka plan
        
    if score >= 0.65:
        level = "Yüksek (Sert Kutuplaşma / Düşmanlaştırıcı Dil)"
    elif score >= 0.35:
        level = "Orta (Gerilimli / Polemikçi Söylem)"
    else:
        level = "Düşük (İtidalli / Nötr Dil)"
        
    return {
        "score": round(score, 3),
        "level": level,
        "markers_found": list(set(found_markers)),
        "source_profile": NEWSPAPER_LEANINGS.get(source, {"leaning": "genel", "bias_tendency": "standart"})
    }

def calculate_press_divergence(articles_by_source: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Aynı dönemdeki farklı yayın organları arasındaki duygu ve söylem uçurumunu hesaplar.
    """
    if len(articles_by_source) < 2:
        return {"divergence_score": 0.0, "status": "Yetersiz kaynak karşılaştırması"}
        
    source_sentiment_avgs = {}
    for src, items in articles_by_source.items():
        if not items:
            continue
        avg_sent = sum(item.get("sentiment_score", 0.0) for item in items) / len(items)
        source_sentiment_avgs[src] = avg_sent
        
    if not source_sentiment_avgs:
        return {"divergence_score": 0.0, "status": "Boş veri"}
        
    scores = list(source_sentiment_avgs.values())
    max_diff = max(scores) - min(scores)
    # 0.0 ile 2.0 arasındaki sentiment farkını 0 - 100 indeksine çevir
    divergence_score = min(100.0, (max_diff / 1.6) * 100.0)
    
    return {
        "divergence_score": round(divergence_score, 1),
        "sentiment_by_source": {k: round(v, 2) for k, v in source_sentiment_avgs.items()},
        "spread_gap": round(max_diff, 2)
    }
