"""
MedyaTarih - Canlı Basın ve Gerçek Zamanlı RSS İçe Aktarma Modülü (Live Ingest Pipeline)
Evrensel, BirGün, Cumhuriyet, Gazete Duvar, Bianet, BloombergHT, NTVEkonomi, Sol Haber gibi
bağımsız ve merkez akışlardan gerçek zamanlı haberleri çeker, sınıflandırır ve veritabanına işler.
"""

import html
import json
import re
import urllib.request
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, List, Any

from app.database import get_connection
from app.nlp.class_sentiment import SinifsalDuyguMotoru

# Canlı RSS Kaynak Konfigürasyonu
FEEDS_CONFIG = [
    {
        "name": "Evrensel",
        "url": "https://www.evrensel.net/rss/haber.xml",
        "newspaper_type": "sol",
        "default_category": "İşçi & Emek",
        "weight": 1.2
    },
    {
        "name": "BirGün",
        "url": "https://www.birgun.net/xml/rss.xml",
        "newspaper_type": "sol",
        "default_category": "Toplum & Siyaset",
        "weight": 1.2
    },
    {
        "name": "Cumhuriyet Ekonomi",
        "url": "https://www.cumhuriyet.com.tr/rss/ekonomi.xml",
        "newspaper_type": "merkez",
        "default_category": "Ekonomi",
        "weight": 1.0
    },
    {
        "name": "Cumhuriyet",
        "url": "https://www.cumhuriyet.com.tr/rss/son_dakika.xml",
        "newspaper_type": "merkez",
        "default_category": "Siyaset",
        "weight": 1.0
    },
    {
        "name": "Gazete Duvar",
        "url": "https://www.gazeteduvar.com.tr/export/rss",
        "newspaper_type": "muhalif",
        "default_category": "Siyaset",
        "weight": 1.1
    },
    {
        "name": "Bianet",
        "url": "https://bianet.org/biamag.rss",
        "newspaper_type": "muhalif",
        "default_category": "İşçi & Emek",
        "weight": 1.1
    },
    {
        "name": "Sol Haber",
        "url": "https://haber.sol.org.tr/rss.xml",
        "newspaper_type": "sol",
        "default_category": "İşçi & Emek",
        "weight": 1.2
    },
    {
        "name": "BloombergHT",
        "url": "https://www.bloomberght.com/rss",
        "newspaper_type": "ekonomi",
        "default_category": "Ekonomi",
        "weight": 0.9
    },
    {
        "name": "NTV Ekonomi",
        "url": "https://www.ntv.com.tr/ekonomi.rss",
        "newspaper_type": "iktidar",
        "default_category": "Ekonomi",
        "weight": 0.9
    }
]

_class_engine = SinifsalDuyguMotoru()
HTML_TAG_RE = re.compile(r'<[^>]+>')

def clean_html(text: str) -> str:
    if not text:
        return ""
    unescaped = html.unescape(text)
    cleaned = HTML_TAG_RE.sub(' ', unescaped)
    return ' '.join(cleaned.split()).strip()

def fetch_full_article_content(link: str) -> str:
    """Haberin orijinal web sayfasından tüm paragraf metinlerini çeker."""
    if not link or not link.startswith("http"):
        return ""
    try:
        req = urllib.request.Request(
            link,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        )
        with urllib.request.urlopen(req, timeout=3.5) as response:
            html_data = response.read()
        soup = BeautifulSoup(html_data, "html.parser")
        for bad in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript"]):
            bad.extract()
        paras = []
        for p in soup.find_all("p"):
            txt = p.get_text().strip()
            if len(txt) > 35 and not any(ign in txt.lower() for ign in ["çerez", "cookie", "tüm hakları saklıdır", "abone ol", "bülten"]):
                paras.append(txt)
        if paras:
            return "\n\n".join(paras[:12])
    except Exception:
        pass
    return ""

def detect_category(title: str, content: str, default_cat: str) -> str:
    combined = (title + " " + content).lower()
    if any(k in combined for k in ["grev", "sendika", "işçi", "asgari ücret", "kıdem", "tazminat", "eylem", "iş bırak", "direniş", "emek"]):
        return "İşçi & Emek"
    if any(k in combined for k in ["enflasyon", "dolar", "faiz", "bütçe", "vergi", "zam", "fiyat", "borsa", "kredi", "ihracat", "ithalat", "merkez bankası"]):
        return "Ekonomi"
    if any(k in combined for k in ["seçim", "parti", "meclis", "hükümet", "chp", "akp", "mhp", "anayasa", "bakan", "cumhurbaşkanı"]):
        return "Siyaset"
    if any(k in combined for k in ["kira", "barınma", "gıda", "sağlık", "eğitim", "öğrenci", "deprem", "çevre", "su", "ulaşım"]):
        return "Toplum & Kent"
    return default_cat

def detect_crisis_category(title: str, content: str) -> str:
    combined = (title + " " + content).lower()
    if any(k in combined for k in ["enflasyon", "pahalılık", "fiyat artış"]):
        return "enflasyon"
    if any(k in combined for k in ["dolar", "euro", "döviz", "kur", "devalüasyon"]):
        return "kur"
    if any(k in combined for k in ["faiz", "politika faizi"]):
        return "faiz"
    if any(k in combined for k in ["zam", "ücret", "tarife"]):
        return "zam"
    if any(k in combined for k in ["imf", "borç", "dış borç", "kredi notu"]):
        return "borc_imf"
    if any(k in combined for k in ["kriz", "çöküş", "iflas", "batık"]):
        return "genel_kriz"
    return "yok"

def fetch_and_ingest_all(limit_per_feed: int = 50) -> Dict[str, Any]:
    """Tüm yapılandırılmış canlı RSS akışlarını çeker ve veritabanına yazar."""
    conn = get_connection()
    cursor = conn.cursor()

    # Mevcut haber başlıklarını hafızaya al (mükerrer kayıt engelleme)
    existing_titles = set(row[0] for row in cursor.execute("SELECT title FROM articles").fetchall())

    added_by_source = {}
    total_added = 0
    errors = []

    for cfg in FEEDS_CONFIG:
        source_name = cfg["name"]
        url = cfg["url"]
        added_by_source[source_name] = 0

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                xml_data = response.read()

            feed = feedparser.parse(xml_data)
            entries = feed.entries[:limit_per_feed]

            for entry in entries:
                raw_title = entry.get("title", "")
                title = clean_html(raw_title)
                if not title or len(title) < 8 or title in existing_titles:
                    continue

                article_link = entry.get("link", "")
                raw_summary = entry.get("summary", "") or entry.get("description", "")
                summary_content = clean_html(raw_summary)

                # Tam sayfa içeriğini çekmeyi dene; bulunamazsa RSS özetine dön
                scraped_content = fetch_full_article_content(article_link)
                content = scraped_content if len(scraped_content) > 100 else summary_content
                if len(content) < 15:
                    content = title

                # Tarih ayrıştırma
                parsed_time = entry.get("published_parsed") or entry.get("updated_parsed")
                if parsed_time:
                    year = parsed_time.tm_year
                    month = parsed_time.tm_mon
                    day = parsed_time.tm_mday
                    date_str = f"{year:04d}-{month:02d}-{day:02d}"
                else:
                    now = datetime.now()
                    year = now.year
                    month = now.month
                    date_str = now.strftime("%Y-%m-%d")

                # Sınıfsal ve duygu analizi çalıştır
                full_text = f"{title}. {content}"
                nlp_res = _class_engine.analiz_et_tekil(full_text)

                halk_duygu = float(nlp_res["halk_odakli_duygu"])
                ham_bert = float(nlp_res["ham_bert_skoru"])
                kriz_yuku = float(nlp_res["yapisal_kriz_yuku"])
                direnis = float(nlp_res["direnis_dinamizmi"])

                sentiment_label = "pozitif" if halk_duygu > 0.08 else ("negatif" if halk_duygu < -0.08 else "nötr")
                category = detect_category(title, content, cfg["default_category"])
                crisis_cat = detect_crisis_category(title, content)

                keywords = [w for w in ["enflasyon", "zam", "faiz", "grev", "dolar", "asgari ücret", "vergi", "sendika", "kriz", "kira"] if w in full_text.lower()]

                # Veritabanına Ekle
                cursor.execute("""
                    INSERT INTO articles (
                        title, content, source, newspaper_type, date, year, month,
                        category, sentiment_label, sentiment_score, polarization_score,
                        crisis_score, crisis_category, keywords, entities, source_type, image_url, url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    title,
                    content,
                    source_name,
                    cfg["newspaper_type"],
                    date_str,
                    year,
                    month,
                    category,
                    sentiment_label,
                    halk_duygu,
                    direnis,
                    kriz_yuku,
                    crisis_cat,
                    json.dumps(keywords, ensure_ascii=False),
                    json.dumps([], ensure_ascii=False),
                    "live_rss",
                    article_link,
                    article_link
                ))

                existing_titles.add(title)
                added_by_source[source_name] += 1
                total_added += 1

            conn.commit()
        except Exception as e:
            errors.append(f"{source_name}: {str(e)}")

    total_now = cursor.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    conn.close()

    return {
        "success": True,
        "total_added": total_added,
        "added_by_source": added_by_source,
        "total_articles": total_now,
        "errors": errors,
        "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
