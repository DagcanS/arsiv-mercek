import React, { useState } from 'react';
import { Calendar, Activity, Zap, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

const HISTORICAL_PRESS_MILESTONES = [
  { year: 1970, title: '15-16 Haziran İşçi Direnişi', desc: 'DİSK kapatma girişimine karşı 100 bin işçi barikat kurdu' },
  { year: 1980, title: '24 Ocak Kararları & 12 Eylül', desc: 'Neoliberal yapısal uyum programı ve askeri darbe' },
  { year: 1989, title: '1989 Bahar Eylemleri', desc: '600 bin kamu işçisi vizite ve yalınayak yürüyüşü yaptı' },
  { year: 1991, title: 'Büyük Zonguldak Yürüyüşü', desc: '48 bin madenci ve aileleri Ankara karayolunu doldurdu' },
  { year: 1994, title: '5 Nisan Kararları & Devalüasyon', desc: 'TL %38 devalüe edildi, IMF kemer sıkma paketi açıklandı' },
  { year: 1997, title: '28 Şubat Süreci', desc: 'Siyasal gerilim ve sermaye blokları arası çatışma' },
  { year: 2001, title: '2001 Kriz & Banka Batıkları', desc: 'Anayasa fırlatma, dalgalı kur, gecelik faiz ve batık bankalar' },
  { year: 2008, title: 'Küresel Finans Krizi', desc: 'Lehman çöküşü, dünya genelinde daralma ve sanayi etkisi' },
  { year: 2010, title: 'TEKEL İşçileri Çadır Direnişi', desc: '78 gün süren 4-C güvencesizliğine karşı tarihi direniş' },
  { year: 2013, title: 'Gezi Parkı & Faiz Lobisi Söylemi', desc: 'Milyonların katıldığı kentsel hareket ve kur dalgalanması' },
  { year: 2015, title: 'Bursa Metal Fırtına', desc: 'Otomotiv fabrikalarında sarı sendikaya karşı fiili grevler' },
  { year: 2018, title: 'Rahip Brunson & Dolar Şoku', desc: 'Dolar kuru patlaması ve enflasyon sarmalının başlangıcı' },
  { year: 2021, title: 'Nas Politikası & KKM', desc: 'Faiz indirimiyle döviz atağı ve Kur Korumalı Mevduat' },
  { year: 2024, title: 'Şimşek Programı & Geçim Mücadelesi', desc: 'Açlık sınırı, sefalet zammı ve yeni sendikal hak arayışı' }
];

export default function TimelineView({ dualAxisData, articles, onSelectArticle }) {
  const [selectedYear, setSelectedYear] = useState(1970);

  const timeline = dualAxisData?.timeline || [];
  const crossCorr = dualAxisData?.cross_correlation;

  // Seçili yıla ait makaleler
  const yearArticles = articles.filter(a => a.year === selectedYear);

  // SVG Grafiği Boyutları
  const width = 940;
  const height = 280;
  const padding = { top: 35, right: 45, bottom: 45, left: 55 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minYear = 1970;
  const maxYear = 2024;

  const getX = (year) => {
    return padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
  };

  const getY = (val) => {
    const safeVal = Math.max(0, Math.min(1, val ?? 0));
    return padding.top + chartHeight - (safeVal * chartHeight);
  };

  // Kırmızı Çizgi (Yapısal Kriz / Sömürü)
  const krizPoints = timeline
    .filter(d => d.yapisal_kriz_yuku !== null && d.yapisal_kriz_yuku !== undefined)
    .map(d => ({
      x: getX(d.year),
      y: getY(d.yapisal_kriz_yuku),
      ...d
    }));
  const krizPathD = krizPoints.length > 0 ? `M ${krizPoints.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

  // Sarı Çizgi (Direniş & Dayanışma Dinamizmi)
  const direnisPoints = timeline
    .filter(d => d.direnis_dinamizmi !== null && d.direnis_dinamizmi !== undefined)
    .map(d => ({
      x: getX(d.year),
      y: getY(d.direnis_dinamizmi),
      ...d
    }));
  const direnisPathD = direnisPoints.length > 0 ? `M ${direnisPoints.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

  const bestCorr = crossCorr?.best;

  return (
    <div>
      {/* 1. Tarihsel Dönüm Noktaları */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--white-muted)' }}>
          <Calendar size={16} color="var(--yellow-soviet)" />
          <span style={{ fontWeight: 700, color: 'var(--white-pure)' }}>Tarihsel Basın & Mücadele Durakları:</span>
          <span>(Bir döneme tıklayarak verilerini inceleyin)</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
          {HISTORICAL_PRESS_MILESTONES.map((m) => {
            const isSelected = selectedYear === m.year;
            return (
              <button
                key={m.year}
                onClick={() => setSelectedYear(m.year)}
                style={{
                  background: isSelected ? 'var(--red-bg)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1.5px solid var(--red-soviet)' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: isSelected ? 'var(--white-pure)' : 'var(--white-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: isSelected ? 'var(--yellow-soviet)' : '#d1d5db' }}>
                  {m.year}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--white-soft)' }}>{m.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Çift Eksenli Grafik (Kriz vs Direniş) & Çapraz Korelasyon */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Activity size={22} color="var(--red-soviet)" />
              Sınıfsal Çift Eksenli Zaman Serisi (Kriz vs. Direniş)
            </h2>
            <p className="panel-desc">
              Kırmızı Çizgi = Yapısal Kriz Yükü (Zam, yoksulluk, açlık sınırı) • Sarı Çizgi = Direniş & Dayanışma Dinamizmi (Grev, boykot, sendika)
            </p>
          </div>
          <div className="status-badge" style={{ background: 'var(--red-bg)', borderColor: 'var(--border-red)' }}>
            <span>Seçili Yıl: {selectedYear}</span>
          </div>
        </div>

        {/* Çapraz Korelasyon Gerçek İstatistik Kutusu */}
        {bestCorr && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(250, 204, 21, 0.1))', 
            border: '1px solid var(--border-yellow)', 
            borderRadius: '8px', 
            padding: '12px 18px', 
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Zap size={22} color="var(--yellow-soviet)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--white-soft)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--yellow-soviet)' }}>Çapraz Korelasyon (Cross-Correlation): </strong>
              Krizin direnişe en yüksek yansıması: Gecikme = <strong>{bestCorr.lag} yıl</strong>, Pearson <strong>r = {bestCorr.r}</strong>, 
              {' '}p-değeri = <strong>{bestCorr.p}</strong> (n = {bestCorr.n} yıl çifti).{' '}
              <span style={{ color: bestCorr.significant ? 'var(--yellow-soviet)' : 'var(--white-dim)' }}>
                {bestCorr.significant ? '• İstatistiksel olarak anlamlı (p < 0.05)' : '• İstatistiksel olarak anlamlı değil (p ≥ 0.05, veri hacmi kısıtlı)'}
              </span>
            </div>
          </div>
        )}

        {/* SVG Çift Eksenli Grafik */}
        <div style={{ width: '100%', overflowX: 'auto', background: 'rgba(8, 11, 18, 0.85)', borderRadius: '10px', padding: '12px' }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Grid Yatay Çizgileri */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
              <g key={v}>
                <line x1={padding.left} y1={getY(v)} x2={width - padding.right} y2={getY(v)} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={getY(v) + 4} fill="#6b7280" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">%{Math.round(v * 100)}</text>
              </g>
            ))}

            {/* Kırmızı Çizgi (Yapısal Kriz) */}
            {krizPathD && (
              <path
                d={krizPathD}
                fill="none"
                stroke="var(--red-soviet)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Sarı Çizgi (Direniş Dinamizmi) */}
            {direnisPathD && (
              <path
                d={direnisPathD}
                fill="none"
                stroke="var(--yellow-soviet)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Noktalar */}
            {timeline.map((p, i) => {
              const isSelected = p.year === selectedYear;
              const kx = getX(p.year);
              const ky = p.yapisal_kriz_yuku !== null ? getY(p.yapisal_kriz_yuku) : null;
              const dy = p.direnis_dinamizmi !== null ? getY(p.direnis_dinamizmi) : null;

              return (
                <g key={`point-${i}`} onClick={() => setSelectedYear(p.year)} style={{ cursor: 'pointer' }}>
                  {/* Kriz Noktası */}
                  {ky !== null && (
                    <circle cx={kx} cy={ky} r={isSelected ? 6 : 4} fill="var(--red-soviet)" stroke="#ffffff" strokeWidth="1.5" />
                  )}
                  {/* Direniş Noktası */}
                  {dy !== null && (
                    <circle cx={kx} cy={dy} r={isSelected ? 6 : 4} fill="var(--yellow-soviet)" stroke="#ffffff" strokeWidth="1.5" />
                  )}

                  {isSelected && (
                    <line x1={kx} y1={padding.top} x2={kx} y2={height - padding.bottom} stroke="var(--yellow-soviet)" strokeWidth="1.5" strokeDasharray="2 2" />
                  )}

                  {/* Yıl Etiketi */}
                  <text
                    x={kx}
                    y={height - 14}
                    fill={isSelected ? 'var(--yellow-soviet)' : '#9ca3af'}
                    fontSize="11"
                    fontWeight={isSelected ? '800' : '500'}
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {p.year}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Grafik Açıklamaları (Legend) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--white-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '4px', background: 'var(--red-soviet)', borderRadius: '2px' }}></div>
              <span>Yapısal Kriz / Sömürü Şiddeti (Zam, enflasyon, yoksulluk)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '4px', background: 'var(--yellow-soviet)', borderRadius: '2px' }}></div>
              <span>Direniş & Dayanışma Dinamizmi (Grev, boykot, sendika)</span>
            </div>
          </div>
        </div>

        {/* Yıl Slider'ı */}
        <div style={{ marginTop: '20px', background: 'rgba(11, 14, 21, 0.9)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--white-muted)' }}>Zaman Tüneli Seçimi:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--yellow-soviet)', fontWeight: 700 }}>
              {selectedYear} Yılı ({yearArticles.length} Manşet)
            </span>
          </div>
          <input
            type="range"
            min="1970"
            max="2024"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          />
        </div>
      </div>

      {/* 3. Seçili Yıla Ait Manşetler */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">
              <ShieldCheck size={20} color="var(--yellow-soviet)" />
              {selectedYear} Yılı Emek ve Basın Manşetleri
            </h3>
            <p className="panel-desc">
              Seçilen yılda işçi sınıfının hak mücadelesi ve gazetelerin kullandığı sınıfsal çerçeveleme.
            </p>
          </div>
          <span className="badge badge-direnis">{yearArticles.length} Arşiv Kaydı</span>
        </div>

        {yearArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--white-muted)' }}>
            Bu yıl için doğrudan arşiv manşeti bulunmuyor. Lütfen 1970, 1989, 1991, 1994, 2001, 2010, 2015 veya 2024 yıllarını seçin.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {yearArticles.map((art) => (
              <div key={art.id} className="newspaper-headline-card">
                <div>
                  <div className="newspaper-masthead">
                    <span className="newspaper-name">{art.source}</span>
                    <span className="newspaper-date">{art.date}</span>
                  </div>

                  <h4 className="article-headline">{art.title}</h4>
                  <p className="article-content">{art.content}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    <span className={`badge ${art.sentiment_label === 'pozitif' || art.sentiment_label === 'politik_dinamizm_umut' ? 'badge-pos' : 'badge-neg'}`}>
                      {art.sentiment_label} ({art.sentiment_score > 0 ? `+${art.sentiment_score}` : art.sentiment_score})
                    </span>

                    {art.crisis_category && art.crisis_category !== 'yok' && (
                      <span className="badge badge-crisis">
                        Kriz: {art.crisis_category.toUpperCase()} (%{Math.round(art.crisis_score * 100)})
                      </span>
                    )}

                    <span className="tag-pill">
                      Kutuplaşma: %{Math.round(art.polarization_score * 100)}
                    </span>
                  </div>

                  <button
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => onSelectArticle(art)}
                  >
                    <span>Sınıfsal Söylem İncelemesi</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
