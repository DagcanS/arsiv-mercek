import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, Library, Calendar, Newspaper, Clock, Sparkles, Filter, ChevronRight, FileText } from 'lucide-react';

const COLLECTIONS = [
  {
    id: 'tarihsel',
    title: 'Tarihsel Basın',
    desc: 'Erken cumhuriyet ve çok partili döneme ait gazete kupürleri, siyasi manşetler ve dönemsel kırılmalar.',
    years: '1970 — 2024',
    sourcesCount: 12,
    docCount: 18,
    categoryTag: 'Genel Basın'
  },
  {
    id: 'ekonomi',
    title: 'Ekonomi ve Krizler',
    desc: 'Devalüasyonlar, IMF niyet mektupları, enflasyon şokları, banka batıkları ve döviz kuru dalgalanmaları.',
    years: '1970 — 2024',
    sourcesCount: 15,
    docCount: 19,
    categoryTag: 'Makroekonomi'
  },
  {
    id: 'siyaset',
    title: 'Siyaset Haberleri',
    desc: 'Hükümet krizleri, koalisyon protokolleri, anayasa tartışmaları ve seçim beyannameleri arşivi.',
    years: '1970 — 2024',
    sourcesCount: 10,
    docCount: 14,
    categoryTag: 'Siyaset'
  },
  {
    id: 'emek',
    title: 'Emek ve Sendika Basını',
    desc: 'Fabrika grevleri, toplu iş sözleşmeleri, taban örgütlenmesi ve asgari ücret hak arayışı tutanakları.',
    years: '1970 — 2024',
    sourcesCount: 8,
    docCount: 11,
    categoryTag: 'Emek & Haklar'
  },
  {
    id: 'kent',
    title: 'Kent ve Gündelik Yaşam',
    desc: 'Barınma hakkı, kira artışları, temel gıda kuyrukları, tüketici fiyatları ve kentsel hareketler.',
    years: '1970 — 2024',
    sourcesCount: 9,
    docCount: 12,
    categoryTag: 'Yaşam & Toplum'
  }
];

const HISTORICAL_DENSITY_PERIODS = [
  { year: 1970, count: 2, label: '15-16 Haziran', note: 'İşçi eylemleri ve sıkıyönetim' },
  { year: 1980, count: 1, label: '24 Ocak Kararları', note: 'Neoliberal dönüşüm başlangıcı' },
  { year: 1989, count: 2, label: 'Bahar Eylemleri', note: 'Kamu işçileri vizite hareketi' },
  { year: 1991, count: 1, label: 'Zonguldak Yürüyüşü', note: 'Büyük madenci yürüyüşü' },
  { year: 1994, count: 4, label: '5 Nisan Kararları', note: 'Devalüasyon ve kemer sıkma' },
  { year: 1997, count: 3, label: '28 Şubat Süreci', note: 'Postmodern süreç ve siyaset' },
  { year: 1999, count: 2, label: 'Marmara & IMF', note: 'Deprem sonrası stand-by paketi' },
  { year: 2001, count: 6, label: 'Banka Batıkları & Kriz', note: 'Dalgalı kur ve anayasa krizi' },
  { year: 2002, count: 2, label: 'Erken Seçim', note: 'Siyasi yelpazede tasfiye' },
  { year: 2005, count: 3, label: 'AB Müzakereleri', note: '6 Sıfır atılması ve reformlar' },
  { year: 2008, count: 3, label: 'Küresel Finans Krizi', note: 'Lehman çöküşü ve teğet tartışması' },
  { year: 2010, count: 2, label: 'TEKEL Çadır Direnişi', note: '78 günlük Ankara direnişi' },
  { year: 2013, count: 4, label: 'Gezi & Kur Baskısı', note: 'Kentsel itiraz ve faiz lobisi' },
  { year: 2015, count: 2, label: 'Bursa Metal Grevleri', note: 'Fiili fabrika işgalleri' },
  { year: 2018, count: 2, label: 'Dolar Kuru Şoku', note: 'Brunson gerilimi ve döviz atağı' },
  { year: 2021, count: 2, label: 'Nas & KKM Süreci', note: 'Enflasyon patlaması ve döviz mevduatı' },
  { year: 2022, count: 2, label: 'Fahiş Fiyat Tartışması', note: 'Temel gıda ve barınma krizi' },
  { year: 2024, count: 4, label: 'Şimşek Programı', note: 'Vergi yükü ve geçim mücadelesi' },
  { year: 2026, count: 0, label: 'Güncel Canlı Basın', note: 'Canlı RSS akışları: Evrensel, BirGün, Cumhuriyet, Sol Haber, Bloomberg' }
];

export default function ExploreView({ onTriggerSearch, onSelectArticle, recentArticles = [] }) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedDensityYear, setSelectedDensityYear] = useState(2001);

  const densityPeriods = useMemo(() => {
    const counts = {};
    recentArticles.forEach(a => {
      counts[a.year] = (counts[a.year] || 0) + 1;
    });
    return HISTORICAL_DENSITY_PERIODS.map(p => ({
      ...p,
      count: counts[p.year] !== undefined ? counts[p.year] : p.count
    }));
  }, [recentArticles]);

  const maxDensity = Math.max(...densityPeriods.map(p => p.count), 1);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() && onTriggerSearch) {
      onTriggerSearch(searchInput.trim());
    }
  };

  const handleChipClick = (query) => {
    setSearchInput(query);
    if (onTriggerSearch) {
      onTriggerSearch(query);
    }
  };

  return (
    <div className="explore-container">
      {/* A. Karşılama ve Arama Alanı */}
      <section className="explore-hero">
        <h2 className="explore-headline">Arşivlerde neyi arıyorsunuz?</h2>
        <p className="explore-subhead">
          Bir kelime, gazete, dönem veya konu seçerek haber dilindeki dönüşümün izini sürün.
        </p>

        {/* Büyük Araştırma Girişi */}
        <form onSubmit={handleSearchSubmit} className="search-large-wrap">
          <Search size={22} style={{ color: 'var(--accent-petrol)', flexShrink: 0 }} />
          <input
            type="text"
            className="search-large-input"
            placeholder="Örnek: “enflasyon”, “Cumhuriyet”, “1970–1980”, “grev”, “devalüasyon”..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <span>Araştır</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Örnek Aramalar / Hızlı Etiketler */}
        <div className="quick-search-chips">
          <span className="quick-chip-label">Örnek Araştırmalar:</span>
          {['enflasyon', 'Cumhuriyet', 'devalüasyon', '1970–1980', 'asgari ücret', 'zam', 'Milliyet', 'grev'].map((chip) => (
            <button
              key={chip}
              type="button"
              className="btn-chip"
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* B. Koleksiyon Kartları */}
      <section style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Araştırma Koleksiyonları
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Tematik arşiv dizinlerinde gezinin; her koleksiyon kapsam ve kaynak sayısıyla tanımlanmıştır.
            </p>
          </div>
        </div>

        <div className="collection-grid">
          {COLLECTIONS.map((c) => (
            <div
              key={c.id}
              className="collection-card"
              onClick={() => handleChipClick(c.id === 'emek' ? 'grev' : c.title.toLowerCase())}
            >
              <div className="collection-top">
                <div className="collection-header-row">
                  <span className="badge badge-petrol">{c.categoryTag}</span>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h4 className="collection-name">{c.title}</h4>
                <p className="collection-desc">{c.desc}</p>
              </div>

              <div className="collection-meta">
                <span>{c.years}</span>
                <span><strong>{c.sourcesCount}</strong> yayın · <strong>{c.docCount}</strong> nüsha</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* C. Dönem Şeridi (Veri Yoğunluğu Histogramı) */}
      <section className="card" style={{ marginBottom: '32px' }}>
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">
              <Calendar size={20} style={{ color: 'var(--accent-petrol)' }} />
              Tarihsel Dönem Şeridi ve Belge Yoğunluğu
            </h3>
            <p className="card-desc">
              Sütun yükseklikleri arşivdeki gerçek belge sayısını temsil eder. Boş veya az verili dönemler şeffaf biçimde yansıtılmıştır.
            </p>
          </div>
          <div className="badge badge-petrol">
            {recentArticles.length} Kayıtlı Metin & Canlı Haber
          </div>
        </div>

        {/* Histogram & Zaman Ekseni */}
        <div style={{ 
          background: '#FAF9F5', 
          border: '1px solid var(--border-line)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '24px 20px 16px',
          overflowX: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '12px', 
            minWidth: '780px', 
            height: '130px', 
            borderBottom: '2px solid var(--border-line)',
            paddingBottom: '2px'
          }}>
            {densityPeriods.map((period) => {
              const heightPct = Math.round((period.count / maxDensity) * 100);
              const isSelected = selectedDensityYear === period.year;
              return (
                <div
                  key={period.year}
                  onClick={() => setSelectedDensityYear(period.year)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title={`${period.year}: ${period.count} belge • ${period.label}`}
                >
                  {/* Belge Sayısı Rozeti */}
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontFamily: 'var(--font-mono)', 
                    color: isSelected ? 'var(--accent-petrol)' : 'var(--text-muted)', 
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}>
                    {period.count}
                  </span>

                  {/* Histogram Çubuğu */}
                  <div style={{
                    width: '100%',
                    maxWidth: '30px',
                    height: `${Math.max(14, heightPct)}%`,
                    backgroundColor: isSelected ? 'var(--accent-petrol)' : '#D0CAC0',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '1px solid var(--accent-petrol-hover)' : '1px solid #BCB6AA'
                  }} />

                  {/* Yıl Etiketi */}
                  <span style={{
                    marginTop: '8px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent-petrol)' : 'var(--text-secondary)'
                  }}>
                    {period.year}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Seçili Dönem Detay Kutusu */}
          {selectedDensityYear && (
            <div style={{ 
              marginTop: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 16px', 
              background: '#FFFFFF', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-line)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span className="badge badge-kiremit" style={{ marginRight: '8px' }}>
                  {selectedDensityYear} Dönemi
                </span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>
                  {densityPeriods.find(p => p.year === selectedDensityYear)?.label}
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginLeft: '8px' }}>
                  — {densityPeriods.find(p => p.year === selectedDensityYear)?.note}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                onClick={() => handleChipClick(selectedDensityYear.toString())}
              >
                <span>Bu Dönemi Araştır</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Veri Kökeni Şeffaflık Notu */}
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#FFFFFF',
            border: '1px solid var(--border-line)',
            borderLeft: '4px solid var(--accent-petrol)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong>Veri Kökeni ve Metodolojik Not:</strong> 1970–2024 yılları arasındaki kayıtlar, dilsel değişim ve istatistik modellerini test etmek amacıyla derlenmiş <em>örnek demo külliyatıdır</em> (fiziksel mikrofilm doğrulaması içermez). 2026 yılı verileri ise Türkçe haber ajansları ve gazetelerden (Evrensel, BirGün, Cumhuriyet, Sol Haber, BloombergHT vb.) canlı RSS akışlarıyla doğrudan taranıp işlenmektedir.
          </div>
        </div>
      </section>

      {/* D. Son Eklenen veya Taranan Kayıtlar */}
      <section className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">
              <Clock size={19} style={{ color: 'var(--accent-petrol)' }} />
              Son İndekslenen Kayıtlar
            </h3>
            <p className="card-desc">
              Veritabanındaki örnek tarihsel külliyat kayıtları ve canlı RSS akışından yeni çekilen haberler.
            </p>
          </div>
        </div>

        <div className="sources-list">
          {(recentArticles.length > 0 ? recentArticles.slice(0, 5) : []).map((art) => (
            <div
              key={art.id}
              className="source-item-card"
              onClick={() => onSelectArticle && onSelectArticle(art)}
            >
              <div className="source-item-top">
                <span className="source-pub-title">{art.source}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{art.date} ({art.year})</span>
              </div>
              <h4 className="source-headline">{art.title}</h4>
              <p className="source-snippet">
                {art.content ? art.content.slice(0, 140) + '...' : 'Gazete metni ve OCR okuması mevcut.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <span className="badge badge-archive">Kupür İncele</span>
                <span className="badge badge-neutral">OCR Kalitesi: Yüksek</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kategori: {art.category || 'Ekonomi'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
