"""
Analitik ve Zaman Serisi API Uç Noktaları (Analytics Endpoints)
"""

from fastapi import APIRouter, Query
from typing import Optional, Dict, Any, List
import json
import re
from app.database import get_connection
from app.nlp import statistics as st
from app.nlp.crisis_radar import CRISIS_TAXONOMY

router = APIRouter(prefix="/api", tags=["Analytics"])

@router.get("/stats/overview")
def get_overview_stats():
    """Genel sistem ve basın özeti metriklerini döndürür."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Toplam makale ve yıl aralığı
    cursor.execute("""
    SELECT 
        COUNT(*) as total_articles,
        MIN(year) as min_year,
        MAX(year) as max_year,
        AVG(sentiment_score) as avg_sentiment,
        AVG(polarization_score) as avg_polarization,
        AVG(crisis_score) as avg_crisis
    FROM articles
    """)
    row = cursor.fetchone()
    
    # 2. Duygu dağılımı
    cursor.execute("""
    SELECT sentiment_label, COUNT(*) as count 
    FROM articles 
    GROUP BY sentiment_label
    """)
    sentiment_dist = {r["sentiment_label"]: r["count"] for r in cursor.fetchall()}
    
    # 3. Kriz kategorisi dağılımı
    cursor.execute("""
    SELECT crisis_category, COUNT(*) as count 
    FROM articles 
    WHERE crisis_category != 'yok'
    GROUP BY crisis_category
    """)
    crisis_dist = {r["crisis_category"]: r["count"] for r in cursor.fetchall()}
    
    # 4. Gazete kaynak dağılımı
    cursor.execute("""
    SELECT source, COUNT(*) as count, AVG(sentiment_score) as avg_sent
    FROM articles 
    GROUP BY source 
    ORDER BY count DESC
    """)
    source_dist = [
        {"source": r["source"], "count": r["count"], "avg_sentiment": round(r["avg_sent"] or 0, 2)}
        for r in cursor.fetchall()
    ]
    
    conn.close()
    
    return {
        "total_articles": row["total_articles"] or 0,
        "year_range": {"min": row["min_year"] or 1994, "max": row["max_year"] or 2024},
        "averages": {
            "sentiment": round(row["avg_sentiment"] or 0, 3),
            "polarization": round(row["avg_polarization"] or 0, 3),
            "crisis_intensity": round(row["avg_crisis"] or 0, 3)
        },
        "sentiment_distribution": sentiment_dist,
        "crisis_distribution": crisis_dist,
        "sources": source_dist
    }

@router.get("/timeline")
def get_timeline(year_from: Optional[int] = Query(1994), year_to: Optional[int] = Query(2024)):
    """Yıllara göre duygu, kutuplaşma ve kriz zaman serisini döndürür."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT 
        year,
        COUNT(*) as article_count,
        AVG(sentiment_score) as avg_sentiment,
        AVG(polarization_score) as avg_polarization,
        AVG(crisis_score) as avg_crisis,
        SUM(CASE WHEN sentiment_label = 'negatif' THEN 1 ELSE 0 END) as neg_count,
        SUM(CASE WHEN sentiment_label = 'pozitif' THEN 1 ELSE 0 END) as pos_count,
        SUM(CASE WHEN crisis_score >= 0.35 THEN 1 ELSE 0 END) as crisis_count
    FROM articles
    WHERE year >= ? AND year <= ?
    GROUP BY year
    ORDER BY year ASC
    """, (year_from, year_to))
    
    timeline_data = []
    for r in cursor.fetchall():
        timeline_data.append({
            "year": r["year"],
            "article_count": r["article_count"],
            "avg_sentiment": round(r["avg_sentiment"] or 0, 2),
            "avg_polarization": round(r["avg_polarization"] or 0, 2),
            "avg_crisis": round(r["avg_crisis"] or 0, 2),
            "negative_headlines": r["neg_count"],
            "positive_headlines": r["pos_count"],
            "crisis_headlines": r["crisis_count"]
        })

    conn.close()
    return {"timeline": timeline_data}


@router.get("/timeline/class-dual-axis")
def get_class_dual_axis_timeline(max_lag: int = Query(4, ge=1, le=10)):
    """
    Ek mercek - Çift eksenli yıllık seri (makale başına hesaplanıp yıllık ortalaması alınır):
      yapisal_kriz_yuku : zam, enflasyon, yoksulluk, işsizlik terim yoğunluğu
      direnis_dinamizmi : grev, boykot, sendika, eylem terim yoğunluğu
    Çapraz korelasyon yıllık ızgarada gerçek veriden hesaplanır (sabit değer yoktur).
    """
    return st.class_lens_series(st.load_articles(), max_lag=max_lag)

@router.get("/discourse/crisis-radar")
def get_crisis_radar_data():
    """Kriz eksenleri ve dönem bazlı frekans patlamalarını döndürür."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT 
        crisis_category,
        COUNT(*) as count,
        AVG(crisis_score) as avg_severity
    FROM articles
    WHERE crisis_category IS NOT NULL AND crisis_category != 'yok'
    GROUP BY crisis_category
    """)
    
    categories = []
    for r in cursor.fetchall():
        categories.append({
            "category": r["crisis_category"],
            "frequency": r["count"],
            "severity": round(r["avg_severity"] or 0, 2)
        })
        
    # Kritik kriz dönüm noktası olayları
    cursor.execute("""
    SELECT id, title, source, date, year, crisis_score, crisis_category
    FROM articles
    WHERE crisis_score >= 0.4
    ORDER BY crisis_score DESC
    LIMIT 6
    """)
    top_crisis_articles = [dict(r) for r in cursor.fetchall()]

    # Taksonomideki her kriz teriminin arşivdeki gerçek kullanım sayısı
    cursor.execute("SELECT title, content FROM articles")
    corpus = [st.tr_lower(f"{r['title']} {r['content'] or ''}") for r in cursor.fetchall()]
    term_counts = []
    for cat, meta in CRISIS_TAXONOMY.items():
        for kw in meta["keywords"]:
            pattern = re.compile(r"\b" + re.escape(st.tr_lower(kw)))
            count = sum(len(pattern.findall(doc)) for doc in corpus)
            if count > 0:
                term_counts.append({"word": kw, "category": cat, "weight": meta["weight"], "count": count})
    term_counts.sort(key=lambda x: x["count"], reverse=True)

    conn.close()
    return {
        "dimensions": categories,
        "term_counts": term_counts[:10],
        "peak_crisis_articles": top_crisis_articles
    }

@router.get("/discourse/polarization")
def get_polarization_analysis():
    """Gazete blokları ve kutuplaşma karşılaştırmasını döndürür."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT 
        source,
        newspaper_type,
        COUNT(*) as total,
        AVG(polarization_score) as avg_polarization,
        AVG(sentiment_score) as avg_sentiment
    FROM articles
    GROUP BY source
    ORDER BY avg_polarization DESC
    """)
    
    press_stats = []
    for r in cursor.fetchall():
        press_stats.append({
            "source": r["source"],
            "type": r["newspaper_type"],
            "total_articles": r["total"],
            "polarization_score": round(r["avg_polarization"] or 0, 2),
            "sentiment_score": round(r["avg_sentiment"] or 0, 2)
        })
        
    # En yüksek kutuplaşma manşetleri
    cursor.execute("""
    SELECT id, title, source, date, year, polarization_score, sentiment_score
    FROM articles
    ORDER BY polarization_score DESC
    LIMIT 6
    """)
    high_polarization_articles = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "press_blocks": press_stats,
        "highest_polarization_headlines": high_polarization_articles
    }
