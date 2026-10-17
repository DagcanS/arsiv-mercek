"""
İstatistik API Uç Noktaları (/api/stats/*)
Her uç nokta, veritabanındaki gerçek makaleler üzerinden hesaplama yapar.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.nlp import bert_backend
from app.nlp import statistics as st

router = APIRouter(prefix="/api/stats", tags=["Statistics"])


def _parse_years(spec: Optional[str]):
    """'1994-2001' veya '1994–2001' -> (1994, 2001)"""
    if not spec:
        return None
    try:
        clean = spec.replace("–", "-").replace("—", "-").strip()
        parts = clean.split("-")
        return int(parts[0].strip()), int(parts[1].strip())
    except Exception:
        raise HTTPException(status_code=400, detail=f"Geçersiz yıl aralığı: {spec} (örn: 1994-2001)")


@router.get("/engine")
def engine_info():
    articles = st.load_articles()
    return {
        "sentiment_backend": bert_backend.sentiment_backend_name(),
        "embedding_backend": bert_backend.embedding_backend_name(),
        "bert_enabled": bert_backend.enabled(),
        "article_count": len(articles),
        "year_count": len(st.year_grid(articles)),
        "press_blocks": {k: v["label"] for k, v in st.PRESS_BLOCKS.items()},
    }


@router.get("/frequency")
def frequency(
    terms: str = Query(",".join(st.DEFAULT_CRISIS_TERMS)),
    window: int = Query(5, ge=2, le=15),
    z_threshold: float = Query(1.96, ge=1.0, le=4.0),
):
    articles = st.load_articles()
    return st.frequency_series(articles, terms.split(","), window=window, z_threshold=z_threshold)


@router.get("/tfidf")
def tfidf(year: Optional[int] = None, top_n: int = Query(10, ge=3, le=30)):
    articles = st.load_articles()
    data = st.tfidf_by_year(articles, top_n=top_n)
    if year is not None:
        return {"year": year, "terms": data.get(year, [])}
    return {"years": sorted(data.keys()), "by_year": data}


@router.get("/log-odds")
def log_odds(
    mode: str = Query("block", pattern="^(block|period)$"),
    a: str = Query("muhalif_bagimsiz"),
    b: str = Query("iktidar_yanlisi"),
    top_n: int = Query(12, ge=3, le=40),
):
    """
    mode=block  -> a, b basın blok anahtarları (muhalif_bagimsiz, iktidar_yanlisi, merkez, ekonomi)
    mode=period -> a, b yıl aralıkları (örn: a=1994-2001, b=2018-2024)
    """
    articles = st.load_articles()
    if mode == "block":
        if a not in st.PRESS_BLOCKS or b not in st.PRESS_BLOCKS:
            raise HTTPException(status_code=400, detail="Bilinmeyen basın bloğu")
        ca = [x["text"] for x in st.filter_block(articles, a)]
        cb = [x["text"] for x in st.filter_block(articles, b)]
        label_a, label_b = st.PRESS_BLOCKS[a]["label"], st.PRESS_BLOCKS[b]["label"]
    else:
        ra, rb = _parse_years(a), _parse_years(b)
        ca = [x["text"] for x in articles if ra[0] <= x["year"] <= ra[1]]
        cb = [x["text"] for x in articles if rb[0] <= x["year"] <= rb[1]]
        label_a, label_b = f"{ra[0]}–{ra[1]}", f"{rb[0]}–{rb[1]}"

    result = st.monroe_log_odds(ca, cb, prior_corpus=[x["text"] for x in articles], top_n=top_n)
    return {"mode": mode, "label_a": label_a, "label_b": label_b, "docs_a": len(ca), "docs_b": len(cb), **result}


@router.get("/sentiment-series")
def sentiment_series(
    lens: str = Query("ham", pattern="^(ham|halk)$"),
    span: int = Query(3, ge=2, le=12),
    window: int = Query(5, ge=2, le=15),
    z_threshold: float = Query(1.96, ge=1.0, le=4.0),
    k: float = Query(0.5, ge=0.0, le=2.0),
    h: float = Query(3.0, ge=1.0, le=8.0),
):
    articles = st.load_articles()
    return st.sentiment_series(articles, lens=lens, span=span, window=window, z_threshold=z_threshold, k=k, h=h)


@router.get("/polarization-series")
def polarization_series(
    a: str = Query("muhalif_bagimsiz"),
    b: str = Query("iktidar_yanlisi"),
    alpha: float = Query(1.3, ge=0.1, le=1.6),
):
    if a not in st.PRESS_BLOCKS or b not in st.PRESS_BLOCKS:
        raise HTTPException(status_code=400, detail="Bilinmeyen basın bloğu")
    articles = st.load_articles()
    return st.polarization_series(articles, a, b, alpha=alpha)


@router.get("/class-lens")
def class_lens(max_lag: int = Query(4, ge=1, le=10)):
    """Ek mercek: yapısal kriz yükü vs. toplumsal hareket dinamizmi + çapraz korelasyon."""
    articles = st.load_articles()
    return st.class_lens_series(articles, max_lag=max_lag)


@router.post("/sync-live-rss")
def sync_live_rss(limit: int = Query(40, ge=5, le=100)):
    """Canlı haber kaynaklarından (Evrensel, BirGün, Bianet, Cumhuriyet, Bloomberg vb.) güncel haberleri çeker ve dizine ekler."""
    from app.pipeline.live_ingest import fetch_and_ingest_all
    return fetch_and_ingest_all(limit_per_feed=limit)
