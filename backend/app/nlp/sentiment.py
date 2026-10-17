"""
Kural ve Sözlük Tabanlı Türkçe Basın Duygu Analiz Motoru
=========================================================
Bu modül, Türkçe ekonomi ve siyaset haber başlıklarındaki duygu durumunu
basın jargonu sözlüğü, pekiştirici katsayılar ve Türkçe olumsuzluk ekleri
(-madı/-medi, değil, yok, önlendi) ile kural tabanlı olarak hesaplar.

Not: Derin öğrenme tabanlı transformatör modeli (BERTurk) bert_backend.py
modülü altında tanımlı olup, 'MEDYATARIH_USE_BERT=1' ortam değişkeniyle
isteğe bağlı (opsiyonel) olarak etkinleştirilebilir.
"""

import re
from typing import Dict, Any, List

# Pozitif Terimler (Basın & Ekonomi Ağırlıklı)
POSITIVE_LEXICON = {
    "büyüme": 1.5, "rekor": 1.2, "canlanma": 1.5, "istikrar": 1.6, "iyileşme": 1.4,
    "artış": 0.8, "yükseliş": 1.1, "kazanç": 1.2, "başarı": 1.5, "anlaşma": 1.2,
    "rahatlama": 1.4, "tarihi zirve": 1.6, "güven": 1.3, "fırsat": 1.1, "yatırım": 1.2,
    "reform": 1.3, "atılım": 1.4, "müjde": 1.7, "çözüm": 1.3, "umut": 1.3,
    "ihracat rekoru": 1.8, "düşüşe geçti": 1.1, "ferah": 1.2, "olumlu": 1.3,
    "destek": 1.0, "üretim": 1.0, "kazandırdı": 1.4, "tırmanış": 0.9, "zenginleşme": 1.3,
    "ferahlık": 1.4, "bahar havası": 1.6, "yüzleri güldürdü": 1.7, "moraller yüksek": 1.6,
    "faiz indirimi": 0.9, "dezenflasyon": 1.3, "not artırımı": 1.7, "gri listeden çıktı": 1.8
}

# Negatif Terimler (Kriz, Basın & Siyaset Ağırlıklı)
NEGATIVE_LEXICON = {
    "kriz": 2.2, "çöküş": 2.2, "felaket": 2.3, "enflasyon": 1.6, "zam": 1.7,
    "devalüasyon": 2.4, "iflas": 2.3, "batık": 2.1, "panik": 2.0, "şok": 1.8,
    "yangın": 1.7, "darboğaz": 1.9, "yoksulluk": 1.8, "pahalılık": 1.7, "kan kaybı": 1.9,
    "tarihi dip": 2.0, "dolar patladı": 2.5, "eridi": 1.8, "vurgun": 2.0, "kaos": 2.2,
    "yolsuzluk": 2.1, "skandal": 2.0, "gerilim": 1.6, "tepki": 1.2, "isyan": 1.9,
    "işsizlik": 1.8, "borç batağı": 2.3, "moratoryum": 2.5, "faiz patlaması": 2.2,
    "gecelik faiz": 1.9, "çaresizlik": 1.8, "hüsran": 1.7, "tırmandı": 1.3,
    "facia": 2.3, "tasfiye": 1.5, "tehlike": 1.6, "kara çarşamba": 2.4, "kara cuma": 2.2,
    "rezervler eridi": 2.3, "kara delik": 2.0, "kapanma": 1.5, "haciz": 2.0,
    "kepenk kapattı": 2.1, "hayat pahalılığı": 1.9, "tükeniş": 2.0, "çöküntü": 2.1
}

# Olumsuzluk & Ters Çevirici İfadeler
NEGATION_WORDS = ["değil", "yok", "bitti", "sonlandı", "durdu", "durduruldu", "önlendi", "uzak"]
INTENSIFIERS = {
    "çok": 1.4, "büyük": 1.3, "tarihi": 1.5, "tarihin en büyük": 1.8,
    "ağır": 1.4, "derin": 1.5, "şiddetli": 1.5, "inanılmaz": 1.4,
    "feci": 1.6, "dev": 1.3, "tam": 1.2, "aşırı": 1.4
}

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Metni tokenize edip duygu durumunu ve skorunu kural tabanlı hesaplar.
    Dönüş: {
        'score': float (-1.0 ile +1.0),
        'label': 'pozitif' | 'nötr' | 'negatif',
        'confidence': float (0.0 - 1.0),
        'pos_words': list,
        'neg_words': list,
        'model': 'sozluk_kural_tabanli_v2'
    }
    """
    if not text or not text.strip():
        return {
            "score": 0.0,
            "label": "nötr",
            "confidence": 0.5,
            "pos_words": [],
            "neg_words": [],
            "model": "sozluk_kural_tabanli_v2"
        }
        
    normalized = text.lower().replace("’", "'").replace("“", '"').replace("”", '"')
    
    pos_score = 0.0
    neg_score = 0.0
    pos_matches = []
    neg_matches = []
    
    # 1. Çok kelimeli özel kalıpları tara
    for phrase, weight in POSITIVE_LEXICON.items():
        if " " in phrase and phrase in normalized:
            pos_score += weight
            pos_matches.append(phrase)
            
    for phrase, weight in NEGATIVE_LEXICON.items():
        if " " in phrase and phrase in normalized:
            neg_score += weight
            neg_matches.append(phrase)
            
    # 2. Tek kelimeleri ve n-gram bağlamlarını tara
    words = re.findall(r'\b\w+\b', normalized)
    n = len(words)
    
    for i, w in enumerate(words):
        # Pekiştirici katsayı (önceki kelime intensifier mı?)
        multiplier = 1.0
        if i > 0 and words[i-1] in INTENSIFIERS:
            multiplier = INTENSIFIERS[words[i-1]]
            
        # Olumsuzluk kontrolü (sonraki veya önceki kelimede 'değil', 'yok' var mı?)
        has_negation = False
        if i + 1 < n and words[i+1] in NEGATION_WORDS:
            has_negation = True
        elif i + 2 < n and words[i+2] in NEGATION_WORDS:
            has_negation = True
            
        if w in POSITIVE_LEXICON and " " not in w:
            val = POSITIVE_LEXICON[w] * multiplier
            if has_negation:
                neg_score += val * 1.1
                neg_matches.append(f"{w} değil")
            else:
                pos_score += val
                pos_matches.append(w)
                
        elif w in NEGATIVE_LEXICON and " " not in w:
            val = NEGATIVE_LEXICON[w] * multiplier
            if has_negation:
                # Kriz bitti / çöküş durduruldu -> olumluya döner
                pos_score += val * 0.9
                pos_matches.append(f"{w} sonlandı/önlendi")
            else:
                neg_score += val
                neg_matches.append(w)
                
        # Türkçe olumsuzluk eki kontrolü (-madı, -medi, -mıyor, -miyor vb.)
        elif w.endswith(("madı", "medi", "mıyor", "miyor", "maz", "mez", "mamalı", "memeli")):
            # Kök pozitif ise negatifleşir
            for pw in POSITIVE_LEXICON:
                if len(pw) > 4 and pw in w:
                    neg_score += 1.0
                    neg_matches.append(w)
                    break

    net_score = pos_score - neg_score
    total_signal = pos_score + neg_score
    
    if total_signal == 0:
        normalized_score = 0.0
        label = "nötr"
        confidence = 0.65
    else:
        # Sigmoid-like yumuşak sıkıştırma (-1.0 ile 1.0 arası)
        import math
        normalized_score = math.tanh(net_score / 2.2)
        confidence = min(0.98, 0.60 + (abs(normalized_score) * 0.35))
        
        if normalized_score > 0.18:
            label = "pozitif"
        elif normalized_score < -0.18:
            label = "negatif"
        else:
            label = "nötr"
            
    return {
        "score": round(normalized_score, 3),
        "label": label,
        "confidence": round(confidence, 3),
        "pos_words": list(set(pos_matches)),
        "neg_words": list(set(neg_matches)),
        "model": "Sözlük-Tabanlı-v2 (lexicon)"
    }

if __name__ == "__main__":
    sample1 = "Ekonomide tarihi büyüme rekoru kırıldı, ihracat tırmanışta"
    sample2 = "Gecelik faiz yüzde 7500'e fırladı, döviz bürolarında panik ve çöküş"
    sample3 = "Merkez Bankası faiz kararını sabit tuttu, piyasalar beklemede"
    print("1:", analyze_sentiment(sample1))
    print("2:", analyze_sentiment(sample2))
    print("3:", analyze_sentiment(sample3))
