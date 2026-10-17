import sqlite3
import json
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "medyatarih.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Gazete & Haber Başlıkları Tablosu
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        source TEXT NOT NULL,
        newspaper_type TEXT DEFAULT 'merkez', -- 'merkez', 'muhalif', 'iktidar', 'ekonomi', 'sol', 'sag'
        date TEXT NOT NULL,                  -- YYYY-MM-DD
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        category TEXT NOT NULL,              -- 'Ekonomi', 'Siyaset', 'Manşet', 'Dış Politika'
        sentiment_label TEXT NOT NULL,       -- 'pozitif', 'nötr', 'negatif'
        sentiment_score REAL NOT NULL,       -- -1.0 ile 1.0 arası
        polarization_score REAL NOT NULL,    -- 0.0 ile 1.0 arası
        crisis_score REAL NOT NULL,          -- 0.0 ile 1.0 arası
        crisis_category TEXT,                -- 'enflasyon', 'kur', 'faiz', 'borc_imf', 'siyasi_kriz', 'yok'
        keywords TEXT,                       -- JSON string listesi
        entities TEXT,                       -- JSON string listesi
        source_type TEXT DEFAULT 'archive',  -- 'archive', 'ocr', 'scraper'
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # İndeksler (hızlı filtreleme ve zaman serisi sorguları için)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_year ON articles(year)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_sentiment ON articles(sentiment_label)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_crisis ON articles(crisis_category)")
    
    # 2. Pipeline Kazıma / OCR İşlem Kayıtları
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pipeline_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_type TEXT NOT NULL,              -- 'ocr', 'scraper', 'nlp_batch'
        target_name TEXT,
        status TEXT NOT NULL,
        items_processed INTEGER DEFAULT 0,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Veritabanı ve tablolar başarıyla oluşturuldu.")
