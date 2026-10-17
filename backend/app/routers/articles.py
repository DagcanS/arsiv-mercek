"""
Makale ve Manşet Arama / Filtreleme API Uç Noktaları
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
import json
from app.database import get_connection

router = APIRouter(prefix="/api/articles", tags=["Articles"])

@router.get("")
def list_articles(
    search: Optional[str] = Query(None, description="Metin veya başlıkta arama"),
    source: Optional[str] = Query(None, description="Gazete / Yayın Organı"),
    category: Optional[str] = Query(None, description="Kategori"),
    year: Optional[int] = Query(None, description="Belirli bir yıl"),
    sentiment: Optional[str] = Query(None, description="pozitif | nötr | negatif"),
    crisis_category: Optional[str] = Query(None, description="Kriz boyutu"),
    sort_by: str = Query("date_desc", description="date_desc, date_asc, crisis_desc, pol_desc, sent_desc"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    conn = get_connection()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append("(title LIKE ? OR content LIKE ? OR keywords LIKE ?)")
        params.extend([term, term, term])
        
    if source:
        conditions.append("source = ?")
        params.append(source)
        
    if category:
        conditions.append("category = ?")
        params.append(category)
        
    if year:
        conditions.append("year = ?")
        params.append(year)
        
    if sentiment:
        conditions.append("sentiment_label = ?")
        params.append(sentiment)
        
    if crisis_category:
        conditions.append("crisis_category = ?")
        params.append(crisis_category)
        
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    # Sıralama mantığı
    order_map = {
        "date_desc": "date DESC, id DESC",
        "date_asc": "date ASC, id ASC",
        "crisis_desc": "crisis_score DESC",
        "pol_desc": "polarization_score DESC",
        "sent_desc": "sentiment_score DESC",
        "sent_asc": "sentiment_score ASC"
    }
    order_clause = f"ORDER BY {order_map.get(sort_by, 'date DESC')}"
    
    # Toplam sayı
    cursor.execute(f"SELECT COUNT(*) FROM articles {where_clause}", params)
    total_count = cursor.fetchone()[0]
    
    # Veri sorgusu
    query = f"SELECT * FROM articles {where_clause} {order_clause} LIMIT ? OFFSET ?"
    cursor.execute(query, params + [limit, offset])
    
    rows = cursor.fetchall()
    articles = []
    for r in rows:
        d = dict(r)
        try:
            d["keywords"] = json.loads(d["keywords"]) if d.get("keywords") else []
        except Exception:
            d["keywords"] = []
        try:
            d["entities"] = json.loads(d["entities"]) if d.get("entities") else []
        except Exception:
            d["entities"] = []
        d["url"] = d.get("url") or d.get("image_url") or ""
        articles.append(d)
        
    conn.close()
    
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "articles": articles
    }

@router.get("/{article_id}")
def get_article(article_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM articles WHERE id = ?", (article_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
        
    d = dict(row)
    try:
        d["keywords"] = json.loads(d["keywords"]) if d.get("keywords") else []
    except Exception:
        d["keywords"] = []
    try:
        d["entities"] = json.loads(d["entities"]) if d.get("entities") else []
    except Exception:
        d["entities"] = []
    d["url"] = d.get("url") or d.get("image_url") or ""
        
    return d
