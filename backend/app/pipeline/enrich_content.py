"""
Mevcut canlı haberlerin orijinal web sayfalarına bağlanarak tam içeriklerini (paragraflarını) çeken
ve NLP sınıfsal duygu analizlerini güncelleyen zenginleştirme betiği.
"""

import sys
import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database import get_connection
from app.nlp.class_sentiment import SinifsalDuyguMotoru

_class_engine = SinifsalDuyguMotoru()

def fetch_content_for_url(url: str) -> str:
    if not url or not url.startswith("http"):
        return ""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        )
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            html_bytes = resp.read()
        soup = BeautifulSoup(html_bytes, "html.parser")
        for bad in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript"]):
            bad.extract()
        paras = []
        for p in soup.find_all("p"):
            txt = p.get_text().strip()
            if len(txt) > 35 and not any(ign in txt.lower() for ign in ["çerez", "cookie", "tüm hakları saklıdır", "abone ol", "bülten"]):
                paras.append(txt)
        if paras:
            return "\n\n".join(paras[:10])
    except Exception:
        pass
    return ""

def enrich_live_articles(max_workers: int = 12):
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, title, content, COALESCE(url, image_url) as link FROM articles WHERE source_type='live_rss'"
    ).fetchall()
    conn.close()

    total = len(rows)
    print(f"Toplam {total} canlı haber taranıp tam içerikle zenginleştirilecek...")

    to_process = []
    for r in rows:
        link = r["link"]
        if link and link.startswith("http"):
            to_process.append((r["id"], r["title"], r["content"], link))

    updated_count = 0
    results_to_save = []

    def process_one(item):
        art_id, title, old_content, link = item
        full_content = fetch_content_for_url(link)
        if full_content and len(full_content) > len(old_content or ""):
            combined_text = f"{title}. {full_content}"
            nlp_res = _class_engine.analiz_et_tekil(combined_text)
            return (
                art_id,
                full_content,
                float(nlp_res["halk_odakli_duygu"]),
                float(nlp_res["direnis_dinamizmi"]),
                float(nlp_res["yapisal_kriz_yuku"]),
                link
            )
        return None

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {executor.submit(process_one, item): item for item in to_process}
        for future in as_completed(future_map):
            res = future.result()
            if res:
                results_to_save.append(res)
                updated_count += 1
                if updated_count % 30 == 0:
                    print(f"[{updated_count}/{len(to_process)}] haberin tam içeriği başarıyla çıkarıldı.")

    # Veritabanına kaydet
    conn = get_connection()
    cursor = conn.cursor()
    for art_id, content, halk_duygu, direnis, kriz, link in results_to_save:
        sentiment_label = "pozitif" if halk_duygu > 0.08 else ("negatif" if halk_duygu < -0.08 else "nötr")
        cursor.execute("""
            UPDATE articles
            SET content = ?,
                sentiment_score = ?,
                polarization_score = ?,
                crisis_score = ?,
                sentiment_label = ?,
                url = ?
            WHERE id = ?
        """, (content, halk_duygu, direnis, kriz, sentiment_label, link, art_id))
    conn.commit()
    conn.close()

    print(f"Tamamlandı! {updated_count} haberin tam metin içeriği ve sınıfsal söylem ölçümleri güncellendi.")

if __name__ == "__main__":
    enrich_live_articles()
