"""
Haber & Medya Arşivi Kazıyıcı Modülü (Media Scraper)
Güncel ve arşiv haber sitelerinden (RSS ve HTML sayfaları) başlıkları,
spotları ve tarihleri çekip NLP hattından geçirerek veritabanına aktarır.
"""

import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
from typing import List, Dict, Any

from app.nlp.sentiment import analyze_sentiment
from app.nlp.polarization import analyze_polarization
from app.nlp.crisis_radar import analyze_crisis_radar

# Popüler Türkçe Haber RSS & Arşiv Kaynakları
DEFAULT_SOURCES = {
    "dunya_ekonomi": {
        "name": "Dünya Gazetesi",
        "category": "Ekonomi",
        "url": "https://www.dunya.com/rss?kategori=ekonomi",
        "type": "rss"
    },
    "anadolu_ajansi": {
        "name": "Anadolu Ajansı",
        "category": "Gündem",
        "url": "https://www.aa.com.tr/tr/rss/default?cat=guncel",
        "type": "rss"
    },
    "bbc_turkce": {
        "name": "BBC Türkçe",
        "category": "Siyaset",
        "url": "https://feeds.bbci.co.uk/turkce/rss.xml",
        "type": "rss"
    }
}

def clean_html(raw_html: str) -> str:
    """HTML etiketlerini temizler."""
    if not raw_html:
        return ""
    clean = re.sub(r'<.*?>', '', raw_html)
    return clean.strip()

def scrape_rss_feed(source_key: str = "dunya_ekonomi", limit: int = 15) -> List[Dict[str, Any]]:
    """
    Belirtilen haber kaynağından RSS ile başlıkları çeker ve NLP analizini yapar.
    """
    source_info = DEFAULT_SOURCES.get(source_key, DEFAULT_SOURCES["dunya_ekonomi"])
    url = source_info["url"]
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MedyaTarih/1.0"
    }
    
    results = []
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        if response.status_code != 200:
            return generate_mock_scraped_articles(source_info["name"], source_info["category"], limit)
            
        soup = BeautifulSoup(response.content, features="xml")
        items = soup.find_all("item")
        
        if not items:
            soup = BeautifulSoup(response.content, "html.parser")
            items = soup.find_all("item")
            
        count = 0
        for item in items:
            if count >= limit:
                break
                
            title_node = item.find("title")
            desc_node = item.find("description")
            pub_date_node = item.find("pubDate")
            link_node = item.find("link")
            
            title = clean_html(title_node.text) if title_node else ""
            desc = clean_html(desc_node.text) if desc_node else ""
            
            if not title or len(title) < 8:
                continue
                
            # NLP analizi
            full_text = f"{title}. {desc}"
            sentiment = analyze_sentiment(full_text)
            polarization = analyze_polarization(full_text, source=source_info["name"])
            crisis = analyze_crisis_radar(full_text)
            
            today_str = datetime.now().strftime("%Y-%m-%d")
            year = datetime.now().year
            month = datetime.now().month
            
            results.append({
                "title": title,
                "content": desc,
                "source": source_info["name"],
                "newspaper_type": "ekonomi" if "Dünya" in source_info["name"] else "merkez",
                "date": today_str,
                "year": year,
                "month": month,
                "category": source_info["category"],
                "sentiment_label": sentiment["label"],
                "sentiment_score": sentiment["score"],
                "polarization_score": polarization["score"],
                "crisis_score": crisis["crisis_score"],
                "crisis_category": crisis["primary_crisis"],
                "keywords": crisis["matched_keywords"] + sentiment["pos_words"] + sentiment["neg_words"],
                "source_type": "scraper",
                "link": link_node.text if link_node else ""
            })
            count += 1
            
    except Exception as e:
        print(f"Scraper hatası ({url}): {e}")
        # Hata durumunda gerçekçi örnek veri döndür
        return generate_mock_scraped_articles(source_info["name"], source_info["category"], limit)
        
    return results

def generate_mock_scraped_articles(source_name: str, category: str, count: int = 5) -> List[Dict[str, Any]]:
    """Ağ hatası veya bağlantı kesintisinde arayüz çökmesini önlemek için şeffaf biçimde sentetik yedek veri üretir."""
    print(f"[UYARI - Scraper] '{source_name}' kaynağından canlı akış alınamadı. {count} adet sentetik demo veri üretiliyor.")
    sample_headlines = [
        ("Merkez Bankası döviz rezervlerinde toparlanma süreci", "Rezervler bu hafta artışla kritik eşiği aştı."),
        ("Sanayi üretiminde hareketlilik: İhracatçılar yeni pazarlara odaklandı", "Kapasite kullanım oranları son ayların seyrini korudu."),
        ("Enflasyonla mücadelede kararlılık: Çarşı ve pazar etiketleri denetleniyor", "Tüketici fiyat endeksinde gerileme beklentisi tartışılıyor."),
        ("Borsa İstanbul haftaya hareketli başladı, bankacılık hisseleri önde", "Hisse senetlerinde sektörel bazda alım eğilimi gözlendi."),
        ("Küresel piyasalarda faiz belirsizliği: Dolar endeksi dalgalanıyor", "Merkez bankalarının faiz patikasındaki açıklamaları takip ediliyor.")
    ]
    
    mock_list = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    for i in range(min(count, len(sample_headlines))):
        title, desc = sample_headlines[i]
        full_text = f"{title}. {desc}"
        sentiment = analyze_sentiment(full_text)
        polarization = analyze_polarization(full_text, source=source_name)
        crisis = analyze_crisis_radar(full_text)
        
        mock_list.append({
            "title": f"[Demo Örnek] {title}",
            "content": desc,
            "source": f"{source_name} (Demo)",
            "newspaper_type": "merkez",
            "date": today_str,
            "year": datetime.now().year,
            "month": datetime.now().month,
            "category": category,
            "sentiment_label": sentiment["label"],
            "sentiment_score": sentiment["score"],
            "polarization_score": polarization["score"],
            "crisis_score": crisis["crisis_score"],
            "crisis_category": crisis["primary_crisis"],
            "keywords": crisis["matched_keywords"] + sentiment["pos_words"],
            "source_type": "mock_fallback",
            "is_mock": True,
            "link": ""
        })
    return mock_list
