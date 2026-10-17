# Arşiv Mercek — Tarihsel ve Güncel Türkçe Basın Söylem Analizi Motoru

> **Basın arşivlerinde ve güncel haber dilinde zamanın izini sürün.**  
> Türkiye basınının dönemsel kriz söylemlerini, göreli sözcük frekanslarını (PPM), Monroe log-odds karşılaştırmalarını ve ideolojik kutuplaşma indeksini hesaplayan açık kaynaklı araştırma motoru ve interaktif analitik platformu.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688.svg?logo=fastapi&logoColor=white)](backend/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_|_Vite_8-61DAFB.svg?logo=react&logoColor=black)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg?logo=python&logoColor=white)](backend/)

---

## 📌 Proje Özeti ve Amacı

**Arşiv Mercek**, medya araştırmacıları, iktisat tarihçileri ve veri gazetecileri için geliştirilmiş bir **Söylem ve Dilsel Değişim Analiz Motorudur**. 

Platform, ham haber metinlerini ve manşetleri alarak:
1. Zaman içindeki sözcük kullanım sıklıklarını korpus büyüklüğünden arındırıp **Milyon Sözcük Başına Frekans (PPM)** cinsinden normalize eder,
2. İki farklı tarihsel dönem (örneğin *1994–2001 Krizleri* ile *2020–2026 Dönemi*) veya iki farklı yayın bloğu (örneğin *Muhalif/Sol Basın* ile *İktidar/Merkez Basın*) arasındaki söylem ayrışmasını **Dirichlet Ön Dağılımlı Monroe Log-Odds** istatistiği ile modeller,
3. Kayan pencere (Rolling Z-Score) anomalileri ile duygu kırılma noktalarını tespit eder,
4. **Esteban-Ray Kutuplaşma Endeksi** ile basındaki kamplaşma şiddetini ölçer.

---

## 🏛 Mimari ve Teknoloji Yığını

Proje, **REST API mimarisine sahip bağımsız bir Python/FastAPI arka ucu** ile **React 19 / Vite tabanlı yüksek performanslı bir kullanıcı arayüzü** olarak yapılandırılmıştır.

```text
┌─────────────────────────────────────────────────────────────┐
│                       KULLANICI ARAYÜZÜ                     │
│               React 19 · Vite 8 · Vanilla CSS3              │
│       Özel SVG/Canvas Grafikleri (LineChart, DivergingBars) │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    FASTAPI ARKA UÇ KATMANI                  │
│       CORS Yapılandırması · Uvicorn · Asenkron İşlemler      │
├──────────────────────────────┬──────────────────────────────┤
│      İSTATİSTİK MOTORU       │       DOĞAL DİL İŞLEME       │
│  • Monroe Log-Odds (Dirichlet)│  • Varsayılan Kural & Sözlük │
│  • PPM Normalizasyonu        │  • Olumsuzluk Eki Analizi    │
│  • Esteban-Ray Kutuplaşma    │  • Opsiyonel: BERTurk Transf.│
│  • Rolling Z-Score Anomali   │  • Levenshtein OCR Onarım    │
├──────────────────────────────┴──────────────────────────────┤
│                   VERİTABANI & BORU HATTI                   │
│   SQLite3 (İndeksli) · Canlı RSS Kazıyıcı (feedparser/bs4)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔬 Bilimsel Metodoloji ve Matematiksel Modeller

Projede kullanılan istatistiksel modeller doğrudan akademik literatürden uyarlanmış olup, kod karşılıkları `backend/app/nlp/statistics.py` ve `backend/app/nlp/polarization.py` dosyalarında yer almaktadır:

### 1. Göreli Frekans Normalizasyonu (PPM - Parts Per Million)
Farklı dönemlerdeki taranan toplam kelime sayısı ($N_t$) değişkenlik gösterdiğinden, ham frekans yerine milyon sözcük başına normalize edilmiş frekans kullanılır:
$$\text{PPM}(w, t) = 10^6 \times \frac{f(w, t)}{N_t}$$
*Kod:* `backend/app/nlp/statistics.py` &rarr; `relative_frequency_ppm()`

### 2. Dirichlet Öncüllü Monroe Log-Odds Karşılaştırması
*(Monroe, Colaresi & Quinn, Political Analysis 2008)*  
İki farklı grup ($A$ ve $B$) arasındaki kelime tercih farkını hesaplarken, seyrek geçen sözcüklerin rastlantısal olarak uç oranlar üretmesini önlemek amacıyla külliyat Dirichlet öncül dağılımı ($\alpha_w$) kullanılır:
$$\hat{\delta}_w^{(A - B)} = \ln \left[ \frac{y_{wA} + \alpha_w}{n_A + \alpha_0 - y_{wA} - \alpha_w} \right] - \ln \left[ \frac{y_{wB} + \alpha_w}{n_B + \alpha_0 - y_{wB} - \alpha_w} \right]$$
Varyans ve standartlaştırılmış $Z$-skoru:
$$\sigma^2 \approx \frac{1}{y_{wA} + \alpha_w} + \frac{1}{y_{wB} + \alpha_w}, \quad Z_w = \frac{\hat{\delta}_w^{(A - B)}}{\sigma}$$
$|Z_w| \ge 1.96$ eşiğini aşan sözcükler, %95 güven düzeyinde ($p < 0.05$) bir döneme veya gruba özgü belirgin terimler olarak raporlanır.  
*Kod:* `backend/app/nlp/statistics.py` &rarr; `monroe_log_odds()`

### 3. Kayan Pencere Anomali Tespiti (Rolling Z-Score)
Zaman serisi içindeki olağandışı söylemsel kırılmaları yakalamak amacıyla yalnızca geçmiş $k$ dönemi kapsayan ortalama ($\mu$) ve standart sapma ($\sigma$) kullanılır; gelecek verisinden bilgi sızıntısı (look-ahead bias) engellenmiştir:
$$Z_t = \frac{S_t - \mu_{t-k \dots t-1}}{\sigma_{t-k \dots t-1}}$$
*Kod:* `backend/app/nlp/statistics.py` &rarr; `rolling_anomaly()`

### 4. Esteban-Ray Kutuplaşma Endeksi
*(Esteban & Ray, Econometrica 1994)*  
Farklı yayın bloklarının (muhalif, iktidar, merkez) ağırlıkları ($\pi_i$) ve ortalama duygu/söylem konumları ($\mu_i$) arasındaki kutuplaşmayı, grup içi özdeşleşme duyarlılığı ($\alpha = 1.3$) parametresiyle modeller:
$$P_{ER} = K \sum_i \sum_j \pi_i^{1 + \alpha} \pi_j |\mu_i - \mu_j|$$
*Kod:* `backend/app/nlp/polarization.py` &rarr; `analyze_polarization()` & `backend/app/nlp/statistics.py` &rarr; `esteban_ray()`

---

## 🔎 Veri Kökeni ve Şeffaflık (Data Provenance)

Projede iki farklı veri kaynağı katmanı bulunmaktadır:

| Katman | Kapsam | Kayıt Sayısı | Doğrulama & Köken Durumu |
| :--- | :--- | :--- | :--- |
| **Canlı RSS Akışı** | 2020 – 2026 | 314+ haber | **Doğrulanmış Gerçek Veri:** Evrensel, BirGün, Cumhuriyet, Sol Haber, Bianet ve BloombergHT RSS akışlarından çekilir. Her kaydın orijinal web URL adresi saklanır ve arayüzde "Kaynağında Oku" bağlantısı sunulur. |
| **Tarihsel Benchmark Külliyatı** | 1970 – 2024 | 43 kayıt | **Sentetik / Örnek Kalibrasyon Verisi:** Türk basın tarihindeki kriz ve dönüm noktalarını (15-16 Haziran, 24 Ocak, 5 Nisan 1994, 2001 Banka Krizleri vb.) modellemek ve algoritmaları test etmek amacıyla hazırlanmış benchmark verisidir. Fiziksel mikrofilm ya da arşiv tarayıcısından doğrulanmış OCR kupürü **değildir**; arayüzde açıkça "Örnek Demo Kaydı" olarak etiketlenmiştir. |

---

## ⚙️ Doğal Dil İşleme: Sözlük Motoru vs. BERTurk

Platform iki aşamalı bir NLP mimarisine sahiptir:

1. **Varsayılan Motor (Hafif ve Hızlı - `app/nlp/sentiment.py`):**
   - Kural ve sözlük tabanlıdır.
   - Türkçe basın ve ekonomi jargonuna özel 90+ terimlik sözlük, pekiştirici katsayılar (`çok`, `tarihi`, `feci`) ve Türkçe biçimbilimsel olumsuzluk ekleri (`-madı/-medi`, `değil`, `sonlandı`, `önlendi`) ile çalışır.
   - Herhangi bir GPU/ağır kütüphane gerektirmez; anında çalışır.

2. **İsteğe Bağlı Derin Öğrenme Motoru (`app/nlp/bert_backend.py`):**
   - HuggingFace üzerindeki `savasy/bert-base-turkish-sentiment-cased` ve `dbmdz/bert-base-turkish-cased` modellerini kullanır.
   - Varsayılan olarak kapalıdır. Etkinleştirmek için `MEDYATARIH_USE_BERT=1` ortam değişkeni tanımlanır.
   - Aktif arka uç durumu `/api/stats/engine` API uç noktasından ve arayüzdeki "Yöntem" sekmesinden doğrulanabilir.

---

## ⚠️ Bilinen Sınırlamalar (Limitations)

- **Kinaye ve İroni:** Kural tabanlı sözlük analizi, ironik veya kinayeli başlıkları nötr ya da zıt algılayabilir.
- **Tarihsel Sansür ve Otosansür:** Türkiye basın tarihindeki sıkıyönetim ve darbe dönemlerinde (örn. 1971, 1980) gazetelerin attığı başlıklar otosansür içerdiğinden, salt başlık analizi dönemin gerçek toplumsal hoşnutsuzluğunu eksik yansıtabilir.
- **Tarihsel Kapsam Genişliği:** 1970–2024 arası kayıtlar örnek benchmark niteliğinde olup, geniş ölçekli mikrofilm sayısallaştırma projelerinin (örn. SALT, İBB Atatürk Kitaplığı) tam korpusunu temsil etmez.

---

## 🚀 Hızlı Başlangıç (Kurulum ve Çalıştırma)

### Gereksinimler
- Python 3.9 veya üzeri
- Node.js 18 veya üzeri ve npm

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/<kullanici-adiniz>/MedyaTarih.git
cd MedyaTarih
```

### 2. Arka Uç (FastAPI) Kurulumu
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

*(Opsiyonel)* BERTurk modelini kullanmak isterseniz:
```bash
pip install torch transformers
export MEDYATARIH_USE_BERT=1
```

Arka uç sunucusunu başlatın:
```bash
python run.py
# Veya: uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload
```
API belgelendirmesi (Swagger UI) `http://127.0.0.1:8008/docs` adresinde aktif olacaktır.

### 3. Ön Yüz (React + Vite) Kurulumu
Yeni bir terminal sekmesinde:
```bash
cd frontend
npm install
npm run dev
```
Tarayıcınızda `http://127.0.0.1:5173/` adresini açarak uygulamayı kullanmaya başlayabilirsiniz.

---

## 📡 API Uç Noktaları Özeti

| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/articles` | Filtrelenebilir haber listesi (`search`, `source`, `year`, `sentiment`, `sort_by`, `limit`, `offset`) |
| `GET` | `/api/stats/overview` | Toplam makale sayısı, yıl dağılımı ve kriz boyutları özeti |
| `GET` | `/api/stats/frequency` | Terimler için göreli frekans serisi (PPM) ve anomali tespiti |
| `GET` | `/api/stats/log-odds` | İki dönem veya yayın bloğu arası Monroe Log-Odds analizi |
| `GET` | `/api/stats/sentiment-series`| Yıllara göre duygu eğrisi (Sözlük / BERTurk lens seçimi ile) |
| `GET` | `/api/stats/polarization-series`| Bloklar arası Esteban-Ray kutuplaşma zaman serisi |
| `POST` | `/api/stats/sync-live-rss` | Canlı RSS kaynaklarından yeni haberleri tarayıp veritabanına işleme |
| `POST` | `/api/lab/ocr-duzelt` | Levenshtein mesafesi ile bozuk OCR metinlerini onarma |

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında açık kaynak olarak sunulmuştur.
