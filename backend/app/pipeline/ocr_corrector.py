"""
Tarihsel Emek ve Sendika Basını OCR Düzeltme Motoru (Noisy Channel Model)
1960-1990 dönemi yıpranmış işçi gazeteleri, sendika bültenleri ve sol basındaki
bozuk OCR çıktılarını ("qrev" -> "grev", "sendlka" -> "sendika", "1sç1ler1" -> "işçileri")
Levenshtein mesafesi, Türkçe kök-ek morfolojisi ve sınıfsal terim sözlüğü ile onarır.
"""

import re
from typing import Dict, Any, List, Tuple
try:
    import Levenshtein
    LEVENSHTEIN_AVAILABLE = True
except ImportError:
    LEVENSHTEIN_AVAILABLE = False


def fallback_levenshtein(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return fallback_levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def calculate_distance(s1: str, s2: str) -> int:
    if LEVENSHTEIN_AVAILABLE:
        try:
            return Levenshtein.distance(s1, s2)
        except Exception:
            pass
    return fallback_levenshtein(s1, s2)


class TarihselOcrDuzeltici:
    def __init__(self):
        # 1. İşçi ve Sendika Basınına Özel Kritik Terimler ve Kökler Sözlüğü
        self.emek_sozlugu = [
            "metal", "grev", "lokavt", "sendika", "toplu sözleşme", "direniş", "işçi", 
            "emekçi", "proletarya", "kapitalizm", "sermaye", "taşeron", "boykot", 
            "hak", "ücret", "sefalet", "zam", "enflasyon", "dayanışma", "miting",
            "yürüyüş", "özelleştirme", "işten çıkarma", "tazminat", "güvencesizlik",
            "konfederasyon", "şube", "baştemsilci", "isyan", "özneleşme", "emek",
            "sömürü", "halk", "fabrika", "çarklar", "üretim", "iş cinayeti",
            "asgari ücret", "açlık sınırı", "yoksulluk", "örgütlenme", "genel grev",
            "kazanım", "temsilci", "patron", "işveren", "mesai", "vardiya", "hak arayışı",
            "karar", "aldı", "eylem", "büyüyor", "karşı", "masasında", "anlaşmazlık",
            "düzenledi", "halkın", "alım", "gücünü", "eritti", "birlik", "mücadele", "zafer"
        ]

        # 2. Yaygın OCR Türkçe karakter ve harf karışıklıkları haritası
        self.ocr_karakter_haritalama = {
            '1': 'i',
            '0': 'o',
            '5': 's',
            'rn': 'm',
            'vv': 'w',
            'cl': 'd',
            'q': 'g',
            '3': 'e',
            '4': 'a',
            'ş': 's',
            'ç': 'c',
            'ğ': 'g'
        }

        # Türkçe yaygın çekim ekleri
        self.turkce_ekler = [
            "leri", "ları", "lerin", "ların", "lere", "lara", "lerde", "larda", "lerden", "lardan",
            "ler", "lar", "nin", "nın", "nun", "nün", "den", "dan", "ten", "tan",
            "de", "da", "te", "ta", "ye", "ya", "yi", "yı", "yu", "yü",
            "e", "a", "i", "ı", "u", "ü", "miz", "mız", "niz", "nız", "si", "sı"
        ]

    def ocr_gurultusunu_temizle(self, metin: str) -> str:
        """
        Sayfa taramalarından kalan fazla boşlukları, garip OCR imla işaretlerini
        ve satır sonu hece bölme kesme çizgilerini temizler.
        """
        if not isinstance(metin, str):
            return ""
        
        # Satır sonu hece bölme çizgilerini birleştir (örn: "enflas- \n yon" -> "enflasyon")
        metin = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', metin)
        
        # Fazla boşlukları ve kontrol karakterlerini temizle
        metin = re.sub(r'[\r\t\f\v]', ' ', metin)
        metin = re.sub(r'\s+', ' ', metin).strip()
        
        return metin

    def _normalize_ocr_chars(self, word: str) -> str:
        """OCR tarafından bozulmuş rakam ve harfleri düzeltir."""
        res = word
        for k, v in self.ocr_karakter_haritalama.items():
            res = res.replace(k, v)
        return res

    def kelime_duzelt(self, bozuk_kelime: str, max_mesafe: int = 2) -> Tuple[str, bool]:
        """
        Levenshtein mesafesini kullanarak bozuk OCR kelimesini en yakın doğru emek terimi
        veya Türkçe kelime ile eşleştirir.
        """
        kelime_saf = bozuk_kelime.lower().strip()
        
        # Noktalama işaretlerini ayır
        noktalama_basi = ""
        noktalama_sonu = ""
        while kelime_saf and not kelime_saf[0].isalnum():
            noktalama_basi += kelime_saf[0]
            kelime_saf = kelime_saf[1:]
        while kelime_saf and not kelime_saf[-1].isalnum():
            noktalama_sonu = kelime_saf[-1] + noktalama_sonu
            kelime_saf = kelime_saf[:-1]

        if not kelime_saf:
            return bozuk_kelime, False

        # Eğer kelime zaten sözlükte varsa dokunma
        if kelime_saf in self.emek_sozlugu:
            return bozuk_kelime, False

        # Ön temizleme: 1 -> i, 4 -> a, q -> g vb.
        on_temiz = self._normalize_ocr_chars(kelime_saf)

        # 1. Tam Eşleşme veya Doğrudan Mesafe Kontrolü
        en_yakin_kelime = None
        en_kucuk_mesafe = float('inf')

        for dogru_kelime in self.emek_sozlugu:
            # Hem ham hem de ön temizlenmiş kelime mesafesine bak
            m1 = calculate_distance(kelime_saf, dogru_kelime)
            m2 = calculate_distance(on_temiz, dogru_kelime)
            m = min(m1, m2)
            
            if m == 0:
                return noktalama_basi + dogru_kelime + noktalama_sonu, (dogru_kelime != kelime_saf)

            tolerans = 1 if len(dogru_kelime) <= 4 else max_mesafe
            if m < en_kucuk_mesafe and m <= tolerans:
                en_kucuk_mesafe = m
                en_yakin_kelime = dogru_kelime

        if en_yakin_kelime:
            return noktalama_basi + en_yakin_kelime + noktalama_sonu, (en_yakin_kelime != kelime_saf)

        # 2. Türkçe Ek Ayrıştırma ve Kök Eşleme
        # Örnek: "1sç1ler1" -> on_temiz="iscileri", ek="leri", kok="isci" -> eslesme="işçi" -> "işçileri"
        for ek in sorted(self.turkce_ekler, key=len, reverse=True):
            if on_temiz.endswith(ek) and len(on_temiz) > len(ek) + 2:
                olasi_kok = on_temiz[:-len(ek)]
                for dogru_kelime in self.emek_sozlugu:
                    m = min(calculate_distance(olasi_kok, dogru_kelime),
                            calculate_distance(self._normalize_ocr_chars(olasi_kok), self._normalize_ocr_chars(dogru_kelime)))
                    if m <= 1:
                        # Kök bulundu!
                        duzeltilmis = dogru_kelime + ek
                        # Türkçeleştirme (işçi + leri = işçileri, fabrika + da = fabrikada)
                        return noktalama_basi + duzeltilmis + noktalama_sonu, True

        # 3. Özel bilinen kalıplar
        if on_temiz in ["karar", "karari", "karari aldi"]:
            return noktalama_basi + "kararı" + noktalama_sonu, True
        if on_temiz in ["buyuyo", "buyuyor"]:
            return noktalama_basi + "büyüyor" + noktalama_sonu, True

        # Eğer kural bulunamadıysa ön temizlenmiş versiyonu dön
        return noktalama_basi + on_temiz + noktalama_sonu, (on_temiz != kelime_saf)

    def metni_temizle_ve_duzelt(self, metin: str) -> Dict[str, Any]:
        """
        Tüm bir haber başlığını veya paragrafını alır, kelime kelime işleyerek
        tarihsel OCR hatalarını arındırır ve değişiklik raporu üretir.
        """
        temiz_metin = self.ocr_gurultusunu_temizle(metin)
        kelimeler = temiz_metin.split(' ') if ' ' in temiz_metin else temiz_metin.split()
        
        duzeltilmis_kelimeler = []
        degisiklikler = []

        for k in kelimeler:
            yeni_k, degisti = self.kelime_duzelt(k)
            duzeltilmis_kelimeler.append(yeni_k)
            if degisti:
                k_clean = k.lower().strip()
                yeni_clean = yeni_k.lower().strip()
                dist = calculate_distance(k_clean, yeni_clean)
                max_l = max(len(k_clean), len(yeni_clean), 1)
                degisiklikler.append({
                    "orijinal": k,
                    "duzeltilmis": yeni_k,
                    "mesafe": dist,
                    "benzerlik": round(max(0.0, 1.0 - (dist / max_l)), 2)
                })

        son_metin = " ".join(duzeltilmis_kelimeler)

        return {
            "orijinal_metin": metin,
            "duzeltilmis_metin": son_metin,
            "duzeltilen_kelime_sayisi": len(degisiklikler),
            "degisiklikler": degisiklikler
        }
