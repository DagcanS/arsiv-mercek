"""
Canlı Laboratuvar API Uç Noktaları (Lab Endpoints)
- Sınıfsal Duygu ve Direniş Düzeltme Motoru
- Tarihsel OCR Hata Düzeltici (Levenshtein + Emek Sözlüğü)
- Emek vs Sermaye Monroe Log-Odds Çerçeveleme Karşılaştırıcısı
- Emek & Bağımsız Basın RSS Akışı
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
from datetime import datetime

from app.nlp.sentiment import analyze_sentiment
from app.nlp.polarization import analyze_polarization
from app.nlp.crisis_radar import analyze_crisis_radar
from app.nlp.class_sentiment import SinifsalDuyguMotoru
from app.nlp.framing_comparator import SinifsalSoylemKiyaslayici
from app.pipeline.ocr_corrector import TarihselOcrDuzeltici
from app.pipeline.ocr_engine import run_ocr
from app.pipeline.halk_scraper import HalkBasiniRSSCollector
from app.database import get_connection

router = APIRouter(prefix="/api/lab", tags=["Laboratory"])

sinifsal_motor = SinifsalDuyguMotoru()
ocr_duzeltici = TarihselOcrDuzeltici()
soylem_kiyaslayici = SinifsalSoylemKiyaslayici()
halk_rss_collector = HalkBasiniRSSCollector()

class TextAnalysisRequest(BaseModel):
    text: str
    source: Optional[str] = "Serbest Metin"
    gamma: Optional[float] = 0.85

class OcrCorrectionRequest(BaseModel):
    text: str
    max_distance: Optional[int] = 2

class FramingRequest(BaseModel):
    emek_metinleri: List[str]
    sermaye_metinleri: List[str]

@router.post("/sinifsal-analiz")
def analyze_class_sentiment(payload: TextAnalysisRequest):
    """
    Halk hareketlerini, grev ve direnişleri kriminalize etmeden
    ham BERT skorunu direniş dinamizmiyle düzelten sınıfsal analiz.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Metin boş olamaz.")
        
    res = sinifsal_motor.analiz_et_tekil(text, gamma=payload.gamma or 0.85)
    return res

@router.post("/ocr-duzelt")
def correct_historical_ocr(payload: OcrCorrectionRequest):
    """
    1960-1990 dönemi yıpranmış işçi gazetesi OCR hatalarını
    Levenshtein mesafesi ve emek terminolojisi sözlüğüyle onarır.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Metin boş olamaz.")
        
    duzeltme_sonucu = ocr_duzeltici.metni_temizle_ve_duzelt(text)
    # Düzeltilmiş metne otomatik sınıfsal duygu uygula
    sinifsal_sonuc = sinifsal_motor.analiz_et_tekil(duzeltme_sonucu["duzeltilmis_metin"])
    
    return {
        **duzeltme_sonucu,
        "sinifsal_analiz": sinifsal_sonuc
    }

@router.post("/log-odds-framing")
def compute_class_framing(payload: FramingRequest):
    """
    Monroe Log-Odds denklemi ile Emek vs Sermaye basınının kullandığı kavramların
    Z-Skoru ve sınıfsal çerçeveleme ayrışmasını hesaplar.
    """
    if not payload.emek_metinleri or not payload.sermaye_metinleri:
        raise HTTPException(status_code=400, detail="Hem emek hem sermaye metinleri gereklidir.")
        
    df = soylem_kiyaslayici.emek_vs_sermaye_log_odds(payload.emek_metinleri, payload.sermaye_metinleri)
    records = df.to_dict(orient="records")
    
    emek_kavramlari = [r for r in records if r["sinifsal_ayrisma_z_skoru"] > 0][:12]
    sermaye_kavramlari = [r for r in records if r["sinifsal_ayrisma_z_skoru"] < 0][-12:]
    
    return {
        "toplam_kavram_sayisi": len(records),
        "emek_basini_kavramlari": emek_kavramlari,
        "sermaye_medyasi_kavramlari": sermaye_kavramlari,
        "tum_kavramlar": records[:30]
    }

@router.get("/halk-rss")
def fetch_halk_rss(kaynak_tipi: str = "emek", limit: int = 6):
    """
    Evrensel, BirGün, Bianet, Sendika.org veya Bloomberg HT, NTV kaynaklarından
    canlı haber başlıklarını çeker ve sınıfsal çerçevelemeyle etiketler.
    """
    haberler = halk_rss_collector.fetch_feeds(kaynak_tipi=kaynak_tipi, limit_per_source=limit)
    return {
        "kaynak_tipi": kaynak_tipi,
        "toplam": len(haberler),
        "haberler": haberler
    }

@router.post("/analyze-text")
def analyze_custom_text(payload: TextAnalysisRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Metin boş olamaz.")
        
    sentiment = analyze_sentiment(text)
    polarization = analyze_polarization(text, source=payload.source)
    crisis = analyze_crisis_radar(text)
    sinifsal = sinifsal_motor.analiz_et_tekil(text, gamma=payload.gamma or 0.85)
    
    return {
        "input_text": text,
        "source": payload.source,
        "sentiment": sentiment,
        "polarization": polarization,
        "crisis_radar": crisis,
        "sinifsal": sinifsal,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/ocr")
async def process_ocr_upload(
    file: UploadFile = File(...),
    save_to_db: bool = Form(False),
    newspaper_name: str = Form("Tarihsel İşçi Gazetesi")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnızca görsel dosyaları kabul edilir.")
        
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Dosya içeriği boş.")
        
    ocr_result = run_ocr(file_bytes, filename=file.filename)
    
    if save_to_db and ocr_result.get("success"):
        conn = get_connection()
        cursor = conn.cursor()
        today = datetime.now()
        sinifsal = ocr_result.get("sinifsal_analiz", {})
        
        all_kw = list(set(
            sinifsal.get("direnis_terimleri", []) + 
            sinifsal.get("kriz_terimleri", [])
        ))
        
        cursor.execute("""
        INSERT INTO articles (
            title, content, source, newspaper_type, date, year, month, category,
            sentiment_label, sentiment_score, polarization_score, crisis_score,
            crisis_category, keywords, entities, source_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ocr_result["headline"],
            ocr_result["body"],
            newspaper_name,
            "sol",
            today.strftime("%Y-%m-%d"),
            today.year,
            today.month,
            "Emek",
            sinifsal.get("etiket", "politik_dinamizm"),
            sinifsal.get("halk_odakli_duygu", 0.0),
            0.65,
            sinifsal.get("yapisal_kriz_yuku", 0.0),
            "enflasyon",
            json.dumps(all_kw, ensure_ascii=False),
            json.dumps([newspaper_name], ensure_ascii=False),
            "ocr"
        ))
        conn.commit()
        conn.close()
        ocr_result["saved_to_db"] = True

    return ocr_result
