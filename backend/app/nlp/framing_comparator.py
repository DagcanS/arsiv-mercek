"""
Sınıfsal Söylem ve Çerçeveleme Karşılaştırıcı (Monroe Log-Odds & Framing Engine)
Emek/Halk basını (Evrensel, BirGün, Sendika.org, Bianet) ile
Sermaye/Ana Akım medyasının (Bloomberg HT, NTV vb.) aynı ekonomik ve siyasi olayları
hangi zıt kavramlarla çerçevelediğini Monroe Log-Odds denklemiyle deşifre eder.
"""

from sklearn.feature_extraction.text import CountVectorizer
import numpy as np
import pandas as pd
from typing import List, Dict, Any

class SinifsalSoylemKiyaslayici:
    def __init__(self):
        # Türkçe etkisiz kelimeler (Stop-words)
        self.stop_words = [
            "ve", "bir", "bu", "da", "de", "için", "ile", "mi", "ama", "gibi",
            "daha", "çok", "en", "ise", "olarak", "olan", "her", "kadar", "sonra",
            "önce", "ne", "var", "yok", "tarafından", "şekilde", "ancak", "gün",
            "yıl", "yeni", "ilk", "son", "tüm", "hep", "öyle", "böyle"
        ]
        self.vectorizer = CountVectorizer(min_df=1, ngram_range=(1, 2), stop_words=self.stop_words)

    def emek_vs_sermaye_log_odds(self, emek_metinleri: List[str], sermaye_metinleri: List[str]) -> pd.DataFrame:
        """
        Monroe Log-Odds denklemi ile:
        Pozitif (+) Z-Skoru yüksek kelimeler -> Emek/Halk basınının (Evrensel, BirGün vb.) öne çıkardığı kavramlar.
        Negatif (-) Z-Skoru yüksek kelimeler -> Sermaye/Ana akım medyanın kullandığı kavramlar.
        """
        if not emek_metinleri or not sermaye_metinleri:
            return pd.DataFrame(columns=["kavram", "emek_basini_frekans", "sermaye_basini_frekans", "sinifsal_ayrisma_z_skoru"])

        tum_korpus = list(emek_metinleri) + list(sermaye_metinleri)
        self.vectorizer.fit(tum_korpus)
        vocab = self.vectorizer.get_feature_names_out()

        if len(vocab) == 0:
            return pd.DataFrame(columns=["kavram", "emek_basini_frekans", "sermaye_basini_frekans", "sinifsal_ayrisma_z_skoru"])

        y_emek = np.asarray(self.vectorizer.transform(emek_metinleri).sum(axis=0)).flatten()
        y_sermaye = np.asarray(self.vectorizer.transform(sermaye_metinleri).sum(axis=0)).flatten()
        alpha = np.asarray(self.vectorizer.transform(tum_korpus).sum(axis=0)).flatten()

        n_emek = float(np.sum(y_emek)) or 1.0
        n_sermaye = float(np.sum(y_sermaye)) or 1.0
        alpha_0 = float(np.sum(alpha)) or 1.0

        # Log-Odds Ratio (Monroe et al.)
        numerator_emek = y_emek + alpha
        denominator_emek = (n_emek + alpha_0) - (y_emek + alpha)
        # 0'a bölme ve negatif log koruması
        denominator_emek = np.maximum(denominator_emek, 1e-5)

        numerator_sermaye = y_sermaye + alpha
        denominator_sermaye = (n_sermaye + alpha_0) - (y_sermaye + alpha)
        denominator_sermaye = np.maximum(denominator_sermaye, 1e-5)

        delta = (np.log(numerator_emek / denominator_emek) - 
                 np.log(numerator_sermaye / denominator_sermaye))
        
        varyans = (1.0 / np.maximum(y_emek + alpha, 1e-5)) + (1.0 / np.maximum(y_sermaye + alpha, 1e-5))
        z_skoru = delta / np.sqrt(varyans)

        df = pd.DataFrame({
            "kavram": vocab,
            "emek_basini_frekans": y_emek.astype(int),
            "sermaye_basini_frekans": y_sermaye.astype(int),
            "sinifsal_ayrisma_z_skoru": np.round(z_skoru, 3)
        })

        # Yalnızca en az bir kez geçen kavramları filtrele
        df = df[(df["emek_basini_frekans"] > 0) | (df["sermaye_basini_frekans"] > 0)]

        return df.sort_values(by="sinifsal_ayrisma_z_skoru", ascending=False)
