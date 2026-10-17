import React, { useState } from 'react';
import { Flame, AlertCircle, TrendingUp, BarChart3, Tag, DollarSign, Building, FileText, Zap } from 'lucide-react';

const CRISIS_META = {
  kur: { title: 'Döviz Kuru & Devalüasyon', color: 'var(--red-soviet)', icon: DollarSign, desc: 'Dolar fırladı, devalüasyon, rezerv erimesi, kur şoku, KKM' },
  enflasyon: { title: 'Enflasyon & Hayat Pahalılığı', color: 'var(--yellow-soviet)', icon: TrendingUp, desc: 'Zam fırtınası, hayat pahalılığı, etiketler, alım gücü çöküşü, açlık sınırı' },
  faiz: { title: 'Faiz & Finansal Sıkışma', color: '#f97316', icon: Building, desc: 'Gecelik faiz %7500, repo, likidite krizi, borsa çöküşü' },
  borc_imf: { title: 'İflas, Dış Borç & IMF', color: '#eab308', icon: FileText, desc: 'IMF stand-by, batık bankalar, konkordato, fon bankaları, moratoryum' },
  siyasi_kriz: { title: 'Siyasal Gerilim & Baskı', color: 'var(--red-soviet-light)', icon: Zap, desc: 'Anayasa kitapçığı fırlatma, grev yasakları, erken seçim, muhtıra' }
};

export default function CrisisRadarView({ crisisData, onSelectArticle }) {
  const [activeCategory, setActiveCategory] = useState('kur');

  const dimensions = crisisData?.dimensions || [];
  const peakArticles = crisisData?.peak_crisis_articles || [];

  return (
    <div>
      {/* 1. Kriz Eksenleri Kartları (5 Boyut) */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Flame size={22} color="var(--red-soviet)" />
              5 Boyutlu Türk Basını Kriz Radarı
            </h2>
            <p className="panel-desc">
              Tarihsel manşetlerde tespit edilen ekonomik ve sınıfsal kriz boyutlarının hasar dağılımı.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {Object.entries(CRISIS_META).map(([key, meta]) => {
            const dataPoint = dimensions.find(d => d.category === key) || { frequency: 0, severity: 0 };
            const isActive = activeCategory === key;
            const Icon = meta.icon;
            return (
              <div
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  background: isActive ? 'rgba(220, 38, 38, 0.12)' : 'rgba(15, 19, 28, 0.9)',
                  border: isActive ? `1.5px solid ${meta.color}` : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '6px', 
                    background: 'rgba(255,255,255,0.06)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: meta.color 
                  }}>
                    <Icon size={18} />
                  </div>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.8rem', 
                    color: meta.color,
                    background: 'rgba(255,255,255,0.04)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {dataPoint.frequency} Manşet
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--white-pure)', marginBottom: '4px' }}>
                  {meta.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--white-muted)', marginBottom: '12px', minHeight: '34px' }}>
                  {meta.desc}
                </div>

                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.round(dataPoint.severity * 100)}%`, 
                    height: '100%', 
                    background: meta.color,
                    borderRadius: '3px'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--white-dim)', marginTop: '4px' }}>
                  <span>Ağırlıklı Şiddet</span>
                  <span style={{ color: meta.color, fontWeight: 700 }}>%{Math.round(dataPoint.severity * 100)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Terim Yoğunluğu & En Ağır Kriz Manşetleri */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ fontSize: '1.1rem' }}>
              <Tag size={18} color="var(--yellow-soviet)" />
              Saptanan Kriz ve Sömürü Terimleri
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(crisisData?.term_counts && crisisData.term_counts.length > 0
              ? crisisData.term_counts
              : [
                  { word: 'dolar', weight: 1.5, category: 'kur', count: 0 },
                  { word: 'enflasyon', weight: 1.4, category: 'enflasyon', count: 0 },
                  { word: 'zam', weight: 1.2, category: 'enflasyon', count: 0 },
                  { word: 'faiz', weight: 1.3, category: 'faiz', count: 0 }
                ]
            ).map((kw, i) => {
              const color = CRISIS_META[kw.category]?.color || 'var(--yellow-soviet)';
              return (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(8, 11, 18, 0.75)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--white-pure)', textTransform: 'capitalize' }}>{kw.word}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--white-dim)' }}>
                      Kategori: {CRISIS_META[kw.category]?.title || kw.category}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: color, fontFamily: 'var(--font-mono)' }}>
                      {kw.count}x
                    </span>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      Ağırlık: {kw.weight}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ fontSize: '1.1rem' }}>
              <Flame size={18} color="var(--red-soviet)" />
              Basın Tarihinin En Yüksek Kriz Skorlu Manşetleri
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {peakArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                style={{
                  background: 'var(--red-bg)',
                  border: '1px solid var(--border-red)',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--yellow-soviet)' }}>
                    {art.source}
                  </span>
                  <span style={{ 
                    background: 'rgba(220, 38, 38, 0.3)', 
                    color: 'var(--white-pure)', 
                    fontSize: '0.72rem', 
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Kriz Skoru: %{Math.round(art.crisis_score * 100)}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--white-pure)', lineHeight: 1.4, marginBottom: '4px' }}>
                  {art.title}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--white-dim)', fontFamily: 'var(--font-mono)' }}>
                  {art.date} • Boyut: {art.crisis_category}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
