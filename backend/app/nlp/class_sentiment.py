"""
Sınıfsal Duygu ve Halk Odaklı Söylem Motoru (Class-Conscious Sentiment Engine)
Standart BERT modellerinin "grev", "direniş", "boykot" ve "protesto" gibi hak arama
eylemlerini ezbere 'negatif/kriz' olarak etiketlemesinden kaynaklanan algoritmik önyargıyı
(bias) düzeltir; sömürüyü (yapısal kriz) ve direnişi (politik özneleşme) iki ayrı eksene ayırır.
"""

import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union

from app.nlp.sentiment import analyze_sentiment as raw_bert_analyzer

class SinifsalDuyguMotoru:
    def __init__(self):
        # 1. Halk hareketlerini ve hak arayışını negatiflikten çıkaran sözlük
        self.direnis_ve_dayanisma_sozlugu = [
            "grev", "direniş", "işbırakma", "boykot", "sendika", "toplu sözleşme",
            "dayanışma", "hak arayışı", "meydan", "yürüyüş", "miting", "kazanım",
            "örgütlenme", "işçi sınıfı", "emekçi", "protesto", "eylem", "genel grev",
            "işçi direnişi", "özneleşme", "omuz omuza", "temsilci", "proletarya", "emek"
        ]
        
        # 2. Gerçek negatifliği (halkın maruz kaldığı yapısal sömürü ve kriz) ölçen sözlük
        self.yapisal_kriz_sozlugu = [
            "zam", "yoksulluk", "açlık sınırı", "iş cinayeti", "işsizlik",
            "güvencesizlik", "enflasyon", "hayat pahalılığı", "ihraç", "baskı",
            "sefalet", "işten çıkarma", "taşeron", "fahiş fiyat", "ücretler eridi",
            "kriz", "çöküş", "borç batağı", "icra", "alım gücü düştü"
        ]

    def _sozluk_agirligi_hesapla(self, metin: str, sozluk: List[str]) -> float:
        """Metindeki anahtar kelimeleri sayıp tanh ile [0, 1] arasına sıkıştırır."""
        metin_kucuk = metin.lower()
        eslesme = sum(1 for kelime in sozluk if kelime in metin_kucuk)
        return float(np.tanh(eslesme * 0.5))

    def analiz_et_tekil(self, metin: str, gamma: float = 0.85) -> Dict[str, Any]:
        """
        Tek bir metni sınıfsal çerçevelemeyle analiz eder:
        1. ham_bert_skoru: Standart modelin çıktısı (-1.0 ile 1.0)
        2. yapisal_kriz_yuku: Sömürü / geçim sıkıntısı şiddeti (0.0 ile 1.0)
        3. direnis_dinamizmi: Örgütlü mücadele / hak arayışı skoru (0.0 ile 1.0)
        4. halk_odakli_duygu: Grev ve eylemleri kriminalize etmeyen, düzeltilmiş duygu (-1.0 ile 1.0)
        """
        raw_res = raw_bert_analyzer(metin)
        ham_skor = raw_res["score"]

        direnis_skoru = self._sozluk_agirligi_hesapla(metin, self.direnis_ve_dayanisma_sozlugu)
        kriz_skoru = self._sozluk_agirligi_hesapla(metin, self.yapisal_kriz_sozlugu)

        # Grev / direniş düzeltme denklemi:
        # S_revize = (P_pos - P_neg) + gamma * tanh(direnis_skoru)
        if direnis_skoru > 0 and ham_skor < 0:
            # Standart modelin protestoya verdiği negatif cezayı iptal et ve umut/dinamizm ekle
            duzeltilmis_skor = float(np.clip(ham_skor + (gamma * (direnis_skoru + abs(ham_skor))), -1.0, 1.0))
        elif direnis_skoru > 0 and ham_skor >= 0:
            duzeltilmis_skor = float(np.clip(ham_skor + (gamma * 0.5 * direnis_skoru), -1.0, 1.0))
        else:
            duzeltilmis_skor = float(ham_skor)

        # Etiket belirleme
        if duzeltilmis_skor > 0.15:
            etiket = "politik_dinamizm_umut" if direnis_skoru > 0 else "olumlu"
        elif duzeltilmis_skor < -0.15:
            etiket = "yapisal_kriz_somuru" if kriz_skoru > 0 else "olumsuz"
        else:
            etiket = "itidalli_notr"

        return {
            "metin": metin,
            "ham_bert_skoru": round(ham_skor, 3),
            "yapisal_kriz_yuku": round(kriz_skoru, 3),
            "direnis_dinamizmi": round(direnis_skoru, 3),
            "halk_odakli_duygu": round(duzeltilmis_skor, 3),
            "etiket": etiket,
            "bias_duzeltildi": (direnis_skoru > 0 and ham_skor < 0),
            "direnis_terimleri": [k for k in self.direnis_ve_dayanisma_sozlugu if k in metin.lower()],
            "kriz_terimleri": [k for k in self.yapisal_kriz_sozlugu if k in metin.lower()]
        }

    def analiz_et(self, metinler: List[str], gamma: float = 0.85) -> pd.DataFrame:
        """Çoklu metinleri analiz edip pandas DataFrame olarak döndürür."""
        sonuclar = [self.analiz_et_tekil(m, gamma=gamma) for m in metinler]
        return pd.DataFrame(sonuclar)
