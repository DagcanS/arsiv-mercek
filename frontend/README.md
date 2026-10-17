# Arşiv Mercek — Frontend (Arayüz Katmanı)

Bu dizin, **Arşiv Mercek (Tarihsel ve Güncel Türkçe Basın Söylem Analizi Motoru)** projesinin React 19 ve Vite tabanlı kullanıcı arayüzünü içerir.

---

## 🛠 Kullanılan Teknolojiler

- **Çekirdek:** React 19 (Fonksiyonel bileşenler & React Hooks)
- **Paketleyici & Dev Server:** Vite 8 (HMR & ESM)
- **Stil & Tasarım Sistemi:** Vanilla CSS3 (Tarihsel gazete tipografisi, özel tasarım belirteçleri/tokens, CSS Variables)
- **İkon Seti:** Lucide React
- **Görselleştirme & Grafikler:** Özel SVG/Canvas tabanlı `LineChart` ve `DivergingBars` bileşenleri (harici ağır grafik kütüphanelerine bağımlılık olmadan optimize edilmiştir).
- **Tipografi:** Google Fonts (`Newsreader` serif, `Inter` sans-serif, `JetBrains Mono` monospace).

---

## 📂 Dizin Yapısı

```text
frontend/
├── public/                  # Favicon ve statik varlıklar
├── src/
│   ├── assets/              # Vektörel ve statik görseller
│   ├── components/
│   │   ├── charts/
│   │   │   ├── LineChart.jsx       # PPM, Duygu ve Çift Eksen zaman serisi grafiği
│   │   │   └── DivergingBars.jsx   # Monroe Log-Odds iki kutuplu karşılaştırma çubukları
│   │   ├── ExploreView.jsx         # Karşılama, arama, koleksiyonlar ve dönem histogramı
│   │   ├── ResearchWorkspace.jsx   # Zaman serisi analizi, filtreleme ve nüsha listesi
│   │   ├── CompareView.jsx         # İki dönem veya yayın bloğu log-odds karşılaştırması
│   │   ├── CollectionsView.jsx     # Tematik külliyat indeksleri
│   │   ├── SavedInvestigationsView.jsx # Kaydedilen araştırmalar ve notlar
│   │   ├── MethodsView.jsx         # Matematiksel formüller ve kod karşılıkları
│   │   ├── ArticleModal.jsx        # Detaylı belge & metin inceleme modalı
│   │   ├── ArchiveScanner.jsx      # Yükleme ve tarama animasyon bileşeni
│   │   ├── Sidebar.jsx             # Sol ana gezinme menüsü
│   │   └── Topbar.jsx              # Üst bağlam çubuğu, arama ve canlı haber tarama tetikleyicisi
│   ├── services/
│   │   └── api.js                  # FastAPI arka uç REST istemcisi
│   ├── App.jsx                     # Ana uygulama orkestrasyonu ve state yönetimi
│   ├── App.css                     # Yardımcı uygulama stilleri
│   ├── index.css                   # Çekirdek tasarım sistemi, renk paleti ve tipografi
│   └── main.jsx                    # React kök montaj noktası
├── .env.example                    # Örnek ortam değişkenleri
├── package.json                    # Bağımlılıklar ve çalıştırma komutları
└── vite.config.js                  # Vite yapılandırması
```

---

## ⚙️ Yapılandırma & Ortam Değişkenleri

Arka uç API adresini yapılandırmak için `.env` dosyası oluşturabilirsiniz:

```bash
cp .env.example .env
```

`.env` dosya içeriği:
```env
# Varsayılan: http://127.0.0.1:8008/api
VITE_API_URL=http://127.0.0.1:8008/api
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
```

### 2. Geliştirme Sunucusunu Başlatın:
```bash
npm run dev
```
Uygulama varsayılan olarak `http://127.0.0.1:5173/` adresinde çalışacaktır.

### 3. Üretim Derlemesi (Build):
```bash
npm run build
```
Çıktı `dist/` klasörüne statik varlıklar olarak derlenir.
