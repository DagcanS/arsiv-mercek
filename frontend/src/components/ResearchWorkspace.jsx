import React, { useState, useMemo, useEffect } from 'react';
import {
  Filter, Calendar, Bookmark, Check, RefreshCw, Info, ExternalLink, HelpCircle,
  FileText, ArrowUpDown, ChevronDown, CheckCircle, AlertTriangle, Layers, Activity, Zap, Plus, X, BarChart3
} from 'lucide-react';
import LineChart from './charts/LineChart';
import { fetchFrequency, fetchSentimentSeries, fetchClassDualAxisTimeline } from '../services/api';

const QUICK_TERMS = ['enflasyon', 'dolar', 'faiz', 'kriz', 'zam', 'grev', 'imf'];

export default function ResearchWorkspace({
  initialQuery = 'enflasyon',
  articles = [],
  dualAxisData,
  onSelectArticle,
  onSaveInvestigation
}) {
  // Arama & Filtre State
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedTerms, setSelectedTerms] = useState(() => {
    const raw = (initialQuery || 'enflasyon').toLowerCase().trim();
    return raw ? [raw] : ['enflasyon'];
  });
  const [newTermInput, setNewTermInput] = useState('');

  // Metrik Modu: 'ppm' (Sözcük Sıklığı), 'sentiment' (Model Duygusu), 'dual_axis' (Kriz vs Direniş)
  const [metricTab, setMetricTab] = useState('ppm');

  // Filtreler
  const [yearStart, setYearStart] = useState(1970);
  const [yearEnd, setYearEnd] = useState(2026);
  const [selectedPublication, setSelectedPublication] = useState('ALL');
  const [selectedCollection, setSelectedCollection] = useState('ALL');
  const [searchTarget, setSearchTarget] = useState('both');
  const [ocrQuality, setOcrQuality] = useState('ALL');
  const [selectedPointYear, setSelectedPointYear] = useState(null);

  // Kaydetme Durumu
  const [isSaved, setIsSaved] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);

  // 1. Frekans Verisi (PPM)
  const [freqData, setFreqData] = useState(null);
  const [loadingFreq, setLoadingFreq] = useState(false);

  // 2. Duygu Serisi Verisi (EMA & CUSUM)
  const [sentimentLens, setSentimentLens] = useState('halk'); // 'halk' (Düzeltilmiş) veya 'ham' (Generic BERT)
  const [sentimentData, setSentimentData] = useState(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);

  // 3. Çift Eksen Verisi
  const [dualData, setDualData] = useState(dualAxisData);

  // Benzersiz Yayınlar
  const publications = useMemo(() => {
    const set = new Set(articles.map(a => a.source));
    return Array.from(set).sort();
  }, [articles]);

  // Arama Terimi / Filtre Değişince Akıllı Ayrıştırma
  useEffect(() => {
    if (!initialQuery) return;
    const clean = initialQuery.trim();

    // 1. Tarih aralığı kontrolü (örn: "1970–1980", "1994-2001")
    const rangeMatch = clean.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (rangeMatch) {
      setYearStart(parseInt(rangeMatch[1]));
      setYearEnd(parseInt(rangeMatch[2]));
      return;
    }

    // 2. Tek bir yıl kontrolü (örn: "2001")
    const singleYearMatch = clean.match(/^(\d{4})$/);
    if (singleYearMatch) {
      const yr = parseInt(singleYearMatch[1]);
      setSelectedPointYear(yr);
      return;
    }

    // 3. Bilinen gazete / yayın adı kontrolü
    const matchedPub = publications.find(p => p.toLowerCase() === clean.toLowerCase());
    if (matchedPub) {
      setSelectedPublication(matchedPub);
      return;
    }

    // 4. Genel Sözcük / Kavram Araması
    setSearchTerm(clean);
    const wordClean = clean.toLowerCase();
    if (!selectedTerms.includes(wordClean)) {
      setSelectedTerms([wordClean]);
    }
  }, [initialQuery, publications]);

  // Frekans Verisi Çekme (PPM)
  useEffect(() => {
    if (!selectedTerms.length) return;
    setLoadingFreq(true);
    fetchFrequency(selectedTerms, 5, 1.96)
      .then(res => setFreqData(res))
      .catch(err => console.error('Frekans hatası:', err))
      .finally(() => setLoadingFreq(false));
  }, [selectedTerms]);

  // Duygu Serisi Verisi Çekme (Lens veya Tab değiştiğinde)
  useEffect(() => {
    if (metricTab === 'sentiment') {
      setLoadingSentiment(true);
      fetchSentimentSeries({ lens: sentimentLens, span: 3, window: 5 })
        .then(res => setSentimentData(res))
        .catch(err => console.error('Duygu serisi hatası:', err))
        .finally(() => setLoadingSentiment(false));
    }
  }, [metricTab, sentimentLens]);

  // Çift Eksen Verisi Çekme (Eğer prop olarak gelmediyse)
  useEffect(() => {
    if (metricTab === 'dual_axis' && !dualData) {
      fetchClassDualAxisTimeline()
        .then(res => setDualData(res))
        .catch(err => console.error('Çift eksen hatası:', err));
    }
  }, [metricTab, dualData]);

  // Terim Ekleme / Çıkarma
  const handleAddTerm = (t) => {
    const term = t.toLowerCase().trim();
    if (term && !selectedTerms.includes(term)) {
      setSelectedTerms([...selectedTerms, term]);
      setNewTermInput('');
    }
  };

  const handleRemoveTerm = (t) => {
    if (selectedTerms.length > 1) {
      setSelectedTerms(selectedTerms.filter(x => x !== t));
    }
  };


  // Filtrelenmiş Makaleler (Kaynak Paneli İçin)
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      // Yıl Aralığı
      if (art.year < yearStart || art.year > yearEnd) return false;
      // Grafikte Tıklanan Yıl
      if (selectedPointYear && art.year !== selectedPointYear) return false;
      // Yayın
      if (selectedPublication !== 'ALL' && art.source !== selectedPublication) return false;
      // Koleksiyon
      if (selectedCollection !== 'ALL') {
        if (selectedCollection === 'emek' && art.category !== 'İşçi & Emek') return false;
        if (selectedCollection === 'ekonomi' && art.category !== 'Ekonomi') return false;
        if (selectedCollection === 'siyaset' && art.category !== 'Siyaset') return false;
      }
      // Arama Terimleri
      if (searchTerm.trim()) {
        const qList = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const inTitle = qList.some(q => art.title?.toLowerCase().includes(q));
        const inContent = qList.some(q => art.content?.toLowerCase().includes(q));
        if (searchTarget === 'title' && !inTitle) return false;
        if (searchTarget === 'content' && !inContent) return false;
        if (searchTarget === 'both' && !inTitle && !inContent) return false;
      }
      return true;
    });
  }, [articles, yearStart, yearEnd, selectedPointYear, selectedPublication, selectedCollection, searchTerm, searchTarget]);

  // Araştırmayı Kaydet Eylemi
  const handleSave = () => {
    setIsSaved(true);
    if (onSaveInvestigation) {
      onSaveInvestigation({
        query: selectedTerms.join(', '),
        years: `${yearStart}–${yearEnd}`,
        publication: selectedPublication,
        resultCount: filteredArticles.length,
        savedAt: new Date().toLocaleDateString('tr-TR')
      });
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  // ==================== GRAFİK VERİSİ HAZIRLIĞI ====================

  // 1. PPM Grafiği Serileri
  const ppmChartData = useMemo(() => {
    if (!freqData || !freqData.years) return { xs: [], series: [], pins: [] };
    const xs = freqData.years;
    const colors = ['#176B68', '#B96D55', '#527C9B', '#C98A2C', '#8E9896'];

    const series = Object.entries(freqData.series || {}).map(([t, list], idx) => ({
      key: t,
      label: t.toUpperCase(),
      color: colors[idx % colors.length],
      values: list.map(d => d.ppm),
      area: idx === 0
    }));

    const pins = [];
    Object.values(freqData.series || {}).forEach(list => {
      list.forEach(d => {
        if (d.anomaly && d.rolling_z !== null) {
          pins.push({
            x: d.year,
            label: `Z = ${d.rolling_z > 0 ? '+' : ''}${d.rolling_z.toFixed(1)}`,
            color: '#B96D55'
          });
        }
      });
    });

    return { xs, series, pins };
  }, [freqData]);

  // 2. Duygu Serisi Grafiği
  const sentimentChartData = useMemo(() => {
    if (!sentimentData || !sentimentData.years) return { xs: [], series: [], pins: [], refLines: [] };
    const xs = sentimentData.years;
    const series = [
      {
        key: 'ema',
        label: 'Üstel Hareketli Ortalama (EMA-3)',
        color: '#176B68',
        values: sentimentData.ema,
        width: 3,
        area: true
      },
      {
        key: 'mean',
        label: 'Yıllık Ham Model Skoru',
        color: '#8E9896',
        values: sentimentData.mean,
        dashed: true,
        width: 1.5
      }
    ];

    const pins = (sentimentData.anomalies || []).map(a => ({
      x: a.year,
      label: `Kırılma (Z=${a.z > 0 ? '+' : ''}${a.z.toFixed(1)})`,
      color: '#B96D55'
    }));

    const refLines = [
      { y: 0, label: 'Nötr Eksen (0.0)', color: '#DCD9D1' }
    ];

    return { xs, series, pins, refLines };
  }, [sentimentData]);

  // 3. Çift Eksen Grafiği (Kriz vs Direniş)
  const dualAxisChartData = useMemo(() => {
    const list = dualData?.timeline || [];
    if (!list.length) return { xs: [], series: [] };
    const xs = list.map(d => d.year);
    const series = [
      {
        key: 'kriz',
        label: 'Yapısal Kriz Yükü (% zam, enflasyon, borç)',
        color: '#B96D55',
        values: list.map(d => (d.yapisal_kriz_yuku !== null ? d.yapisal_kriz_yuku * 100 : null)),
        width: 2.8
      },
      {
        key: 'direnis',
        label: 'Direniş Dinamizmi (% grev, boykot, sendika)',
        color: '#176B68',
        values: list.map(d => (d.direnis_dinamizmi !== null ? d.direnis_dinamizmi * 100 : null)),
        width: 2.8
      }
    ];
    return { xs, series };
  }, [dualData]);

  const bestCorr = dualData?.cross_correlation?.best;

  return (
    <div>
      {/* Üst Başlık & Bulgular Alanı */}
      <div className="finding-summary-box" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 className="finding-heading">
              “{selectedTerms.join(' & ')}” haber dilinde nasıl değişti?
            </h2>
            <div className="finding-sub">
              <span>{yearStart}–{yearEnd} dönemi</span>
              <span>•</span>
              <span>{selectedPublication === 'ALL' ? `${publications.length} yayın` : selectedPublication}</span>
              <span>•</span>
              <strong style={{ color: 'var(--accent-petrol)' }}>{filteredArticles.length} doğrulanmış nüsha</strong>
              {selectedPointYear && (
                <>
                  <span>•</span>
                  <span className="badge badge-kiremit">Grafikten Seçili Yıl: {selectedPointYear}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPointYear(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-petrol)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}
                  >
                    (Yıl filtresini temizle)
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleSave}
          >
            {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
            <span>{isSaved ? 'Araştırma Kaydedildi' : 'Araştırmayı Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* Çalışma Alanı Düzeni: Sol Sabit Filtre Paneli + Sağ Analiz Alanı */}
      <div className="workspace-layout">
        {/* SOL FİLTRE PANELİ */}
        <aside className="filter-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} style={{ color: 'var(--accent-petrol)' }} />
              Araştırma Filtreleri
            </span>
            <span className="badge badge-neutral">{filteredArticles.length} Kayıt</span>
          </div>

          {/* 1. Tarih Aralığı */}
          <div className="filter-section">
            <label className="filter-title">Tarih Aralığı</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Başlangıç:</span>
                <input
                  type="number"
                  className="input-text"
                  min="1970"
                  max={yearEnd}
                  value={yearStart}
                  onChange={(e) => setYearStart(parseInt(e.target.value) || 1970)}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bitiş:</span>
                <input
                  type="number"
                  className="input-text"
                  min={yearStart}
                  max="2026"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(parseInt(e.target.value) || 2026)}
                />
              </div>
            </div>
          </div>

          {/* 2. Yayın / Gazete */}
          <div className="filter-section">
            <label className="filter-title">Gazete / Yayın</label>
            <select
              className="select-box"
              value={selectedPublication}
              onChange={(e) => setSelectedPublication(e.target.value)}
            >
              <option value="ALL">Tüm Yayınlar ({publications.length})</option>
              {publications.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 3. Koleksiyon Türü */}
          <div className="filter-section">
            <label className="filter-title">Koleksiyon</label>
            <select
              className="select-box"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="ALL">Tüm Koleksiyonlar</option>
              <option value="ekonomi">Ekonomi ve Krizler</option>
              <option value="siyaset">Siyaset Haberleri</option>
              <option value="emek">Emek ve Sendika Basını</option>
            </select>
          </div>

          {/* 4. Arama Kapsamı */}
          <div className="filter-section">
            <label className="filter-title">Arama Kapsamı</label>
            <label className="filter-checkbox-row">
              <input
                type="radio"
                name="target"
                checked={searchTarget === 'both'}
                onChange={() => setSearchTarget('both')}
              />
              <span>Başlık ve Metin</span>
            </label>
            <label className="filter-checkbox-row">
              <input
                type="radio"
                name="target"
                checked={searchTarget === 'title'}
                onChange={() => setSearchTarget('title')}
              />
              <span>Yalnızca Manşet Başlığı</span>
            </label>
            <label className="filter-checkbox-row">
              <input
                type="radio"
                name="target"
                checked={searchTarget === 'content'}
                onChange={() => setSearchTarget('content')}
              />
              <span>Yalnızca Metin İçeriği</span>
            </label>
          </div>

          {/* 5. OCR Durumu */}
          <div className="filter-section">
            <label className="filter-title">Metin Kalitesi</label>
            <label className="filter-checkbox-row">
              <input
                type="radio"
                name="ocr"
                checked={ocrQuality === 'ALL'}
                onChange={() => setOcrQuality('ALL')}
              />
              <span>Tüm Kayıtlar</span>
            </label>
            <label className="filter-checkbox-row">
              <input
                type="radio"
                name="ocr"
                checked={ocrQuality === 'high'}
                onChange={() => setOcrQuality('high')}
              />
              <span>Yüksek Güvenilirlikli Metin</span>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '6px', fontSize: '0.82rem' }}
            onClick={() => {
              setYearStart(1970);
              setYearEnd(2026);
              setSelectedPublication('ALL');
              setSelectedCollection('ALL');
              setSelectedPointYear(null);
            }}
          >
            Filtreleri Sıfırla
          </button>
        </aside>

        {/* SAĞ ANA ANALİZ ALANI */}
        <div className="analysis-main">
          {/* ANALİZ KARTI VE METRİK SEÇİCİ */}
          <div className="card">
            {/* Metrik Sekmeleri */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-line)', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${metricTab === 'ppm' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.84rem', padding: '6px 14px' }}
                  onClick={() => setMetricTab('ppm')}
                >
                  <BarChart3 size={15} />
                  <span>Sözcük Sıklığı (PPM)</span>
                </button>

                <button
                  type="button"
                  className={`btn ${metricTab === 'sentiment' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.84rem', padding: '6px 14px' }}
                  onClick={() => setMetricTab('sentiment')}
                >
                  <Activity size={15} />
                  <span>Duygu Trendi (EMA & CUSUM)</span>
                </button>

                <button
                  type="button"
                  className={`btn ${metricTab === 'dual_axis' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.84rem', padding: '6px 14px' }}
                  onClick={() => setMetricTab('dual_axis')}
                >
                  <Zap size={15} />
                  <span>Sınıfsal Çift Eksen (Kriz vs Direniş)</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMethodModalOpen(!methodModalOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-info)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                >
                  <Info size={15} />
                  <span>Yöntem Notu</span>
                </button>
              </div>
            </div>

            {/* Yöntem Bilgilendirme Notu */}
            {methodModalOpen && (
              <div className="notice-info" style={{ marginBottom: '16px' }}>
                <Info size={16} style={{ flexShrink: 0 }} />
                <span>
                  {metricTab === 'ppm' && (
                    <><strong>PPM Normalizasyonu:</strong> Milyon kelime başına kullanım: <em>PPM(w,t) = 10⁶ × f(w,t)/Nₜ</em>. Grafikteki kiremit bayraklar hareketli pencere (k=5) Z-skoru &ge; 1.96 olan anomali patlamalarını gösterir.</>
                  )}
                  {metricTab === 'sentiment' && (
                    <><strong>Sürekli Duygu & EMA:</strong> Her haber başlığı [-1, +1] ölçeğinde puanlanır. EMA çizgisi geçmiş döneme üstel ağırlık vererek mevsimsel gürültüyü arındırır.</>
                  )}
                  {metricTab === 'dual_axis' && (
                    <><strong>Çift Eksenli Söylem:</strong> Zam, açlık ve devalüasyon yükü ile grev ve sendikal eylemlilik dinamizmi yıllık ızgarada karşılaştırılır.</>
                  )}
                </span>
              </div>
            )}

            {/* 1. METRİK: SÖZCÜK SIKLIĞI (PPM) */}
            {metricTab === 'ppm' && (
              <div>
                {/* Karşılaştırılan Terimler Çubuğu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>İncelenen Terimler:</span>
                  {selectedTerms.map(t => (
                    <span
                      key={t}
                      className="badge badge-petrol"
                      style={{ padding: '4px 10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>{t}</span>
                      {selectedTerms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(t)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}

                  {/* Hızlı Ekleme Çipleri */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>+ Ekle:</span>
                    {QUICK_TERMS.filter(q => !selectedTerms.includes(q)).slice(0, 4).map(q => (
                      <button
                        key={q}
                        type="button"
                        className="btn-chip"
                        onClick={() => handleAddTerm(q)}
                        style={{ fontSize: '0.76rem', padding: '2px 8px' }}
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LineChart Bileşeni */}
                <div style={{ background: '#FAF9F5', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  {loadingFreq ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Frekans serisi normalize edilip hesaplanıyor...
                    </div>
                  ) : (
                    <LineChart
                      xs={ppmChartData.xs}
                      series={ppmChartData.series}
                      pins={ppmChartData.pins}
                      selectedX={selectedPointYear}
                      onSelectX={(yr) => setSelectedPointYear(selectedPointYear === yr ? null : yr)}
                      yFormat={(v) => `${Math.round(v).toLocaleString('tr-TR')} ppm`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 2. METRİK: DUYGU SERİSİ (EMA & CUSUM) */}
            {metricTab === 'sentiment' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  padding: '10px 14px',
                  background: 'var(--bg-paper)',
                  border: '1px solid var(--border-line)',
                  borderRadius: 'var(--radius-sm)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Analiz Merceği:</strong> Grev ve direnişi kriz değil politik özneleşme kabul eden emek düzeltmesi
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${sentimentLens === 'halk' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                      onClick={() => setSentimentLens('halk')}
                    >
                      Emek & Halk Odaklı (Düzeltilmiş)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${sentimentLens === 'ham' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                      onClick={() => setSentimentLens('ham')}
                    >
                      Piyasa Eksenli (Ham BERT)
                    </button>
                  </div>
                </div>

                <div style={{ background: '#FAF9F5', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  {loadingSentiment ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Duygu modeli ve EMA serisi yükleniyor...
                    </div>
                  ) : (
                    <LineChart
                      xs={sentimentChartData.xs}
                      series={sentimentChartData.series}
                      pins={sentimentChartData.pins}
                      refLines={sentimentChartData.refLines}
                      selectedX={selectedPointYear}
                      onSelectX={(yr) => setSelectedPointYear(selectedPointYear === yr ? null : yr)}
                      yFormat={(v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 3. METRİK: SINIFSAL ÇİFT EKSEN (KRİZ VS DİRENİŞ) */}
            {metricTab === 'dual_axis' && (
              <div>
                {/* Çapraz Korelasyon Bilgi Kutusu */}
                {bestCorr && (
                  <div style={{
                    background: '#FAF9F5',
                    border: '1px solid var(--border-line)',
                    borderLeft: '4px solid var(--accent-petrol)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Zap size={20} style={{ color: 'var(--accent-kiremit)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                      <strong>Çapraz Korelasyon: </strong>
                      Yapısal krizin direnişe en yüksek yansıması: Gecikme = <strong>{bestCorr.lag} yıl</strong>,
                      Pearson <strong>r = {bestCorr.r}</strong>, p = <strong>{bestCorr.p}</strong> (n = {bestCorr.n} yıl çifti).{' '}
                      <span style={{ color: bestCorr.significant ? 'var(--accent-petrol)' : 'var(--text-muted)' }}>
                        {bestCorr.significant ? '• İstatistiksel olarak anlamlı' : '• Anlamlılık sınırında (kısıtlı arşiv)'}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ background: '#FAF9F5', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <LineChart
                    xs={dualAxisChartData.xs}
                    series={dualAxisChartData.series}
                    selectedX={selectedPointYear}
                    onSelectX={(yr) => setSelectedPointYear(selectedPointYear === yr ? null : yr)}
                    yFormat={(v) => `%${Math.round(v)}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* İLGİLİ HABERLER / KAYNAK PANELİ */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <h3 className="card-title">
                  <FileText size={19} style={{ color: 'var(--accent-petrol)' }} />
                  Bulguyu Oluşturan Kaynak Kayıtları
                </h3>
                <p className="card-desc">
                  Seçili kriterlere ve grafikte tıklanan yıla uyan özgün gazete küpürleri. Herhangi bir nüshayı tıklayarak iki panelli özgün belge incelemesini açabilirsiniz.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedPointYear && (
                  <span className="badge badge-kiremit">
                    {selectedPointYear} Yılı Seçili
                  </span>
                )}
                <span className="badge badge-neutral">
                  {filteredArticles.length} Nüsha
                </span>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="state-box">
                <div className="state-icon" style={{ background: 'var(--bg-canvas)', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={24} />
                </div>
                <h4 className="state-title">Bu dönem veya filtre için kayıt bulunamadı</h4>
                <p className="state-desc">
                  Grafikten farklı bir yıla tıklamayı veya sol filtre panelindeki yayın/arama sınırlamalarını genişletmeyi deneyin.
                </p>
              </div>
            ) : (
              <div className="sources-list">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    className="source-item-card"
                    onClick={() => onSelectArticle && onSelectArticle(art)}
                  >
                    <div className="source-item-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="source-pub-title">{art.source}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {art.date} ({art.year})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {(art.url || art.image_url?.startsWith('http')) && (
                          <a
                            href={art.url || art.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge badge-petrol"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                            title="Haberi doğrudan gazetenin canlı web sitesinde aç"
                          >
                            <span>Canlı Sayfa</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                        <span className={`badge ${art.source_type === 'live_rss' || art.url ? 'badge-petrol' : 'badge-archive'}`}>
                          {art.source_type === 'live_rss' || art.url ? 'Canlı RSS' : 'Örnek Demo'}
                        </span>
                      </div>
                    </div>

                    <h4 className="source-headline">{art.title}</h4>

                    <p className="source-snippet">
                      {art.content || 'Külliyat metin kaydı.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="badge badge-neutral">{art.category}</span>
                        <span className="badge badge-neutral">Model Skoru: {art.sentiment_score ?? 0}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {(art.url || art.image_url?.startsWith('http')) && (
                          <a
                            href={art.url || art.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--accent-kiremit)',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Haberi Oku</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-petrol)', fontWeight: 600 }}>
                          Detaylı İncele &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
