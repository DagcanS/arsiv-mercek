"""
MedyaTarih - Tarihsel Basın ve Söylem Analizi Motoru
FastAPI Backend Uygulaması
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.seed_data import seed_database
from app.routers import analytics, articles, lab, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Başlangıçta veritabanını ve tohum verilerini yükle
    print("🚀 MedyaTarih başlatılıyor: Veritabanı ve modeller hazırlanıyor...")
    init_db()
    seed_database()
    yield
    print("🛑 MedyaTarih kapatılıyor...")

app = FastAPI(
    title="MedyaTarih API",
    description="Türkçe Basın Söylem Analizi, Göreli Frekans (PPM), Monroe Log-Odds ve Duygu Motoru API Katmanı",
    version="1.0.0",
    lifespan=lifespan
)

import os

allowed_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
if allowed_origins_raw.strip():
    origins = [orig.strip() for orig in allowed_origins_raw.split(",") if orig.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(analytics.router)
app.include_router(articles.router)
app.include_router(lab.router)
app.include_router(stats.router)

@app.get("/")
def read_root():
    return {
        "project": "MedyaTarih",
        "name": "Tarihsel Basın ve Söylem Analizi Motoru",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }
