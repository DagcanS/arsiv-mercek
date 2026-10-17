import React, { useState, useEffect } from 'react';
import { Scale, Users, ShieldAlert, ArrowRight, Zap, BookOpen, Layers, Newspaper, Loader2, AlertCircle } from 'lucide-react';
import DivergingBars from './charts/DivergingBars';
import { fetchLogOdds } from '../services/api';

const QUALITATIVE_FRAMING_CASES = [
  {
    topic: 'İşçi Eylemleri & Grevler',
    emekFraming: 'Hak arayışı, onurlu direniş, anayasal sendikal hak, taban örgütlenmesi ve dayanışma.',
    sermayeFraming: 'Tedarik zincirinde aksama, üretim kaybı, iş gücü maliyet baskısı ve piyasa bozulması.'
  },
  {
    topic: 'Asgari Ücret ve Zamlar',
    emekFraming: 'Sefalet ücreti, açlık sınırı, insanca yaşam hakkı, reel erime ve sermayeye servet transferi.',
    sermayeFraming: 'İş gücü maliyet artışı, ihracatta rekabet kaybı, enflasyon sarmalı ve bütçe disiplini.'
  },
  {
    topic: 'Kriz ve Kemer Sıkma Paketleri',
    emekFraming: 'Fatura emekçiye kesiliyor, halkın cebinden vergi yükü, kamu hizmetlerinde kesinti.',
    sermayeFraming: 'Rasyonel politikalara dönüş, makroekonomik istikrar, dezenflasyon ve yatırımcı güveni.'
  },
  {
    topic: 'Sendikalaşma ve İşten Çıkarma',
    emekFraming: 'Sendika düşmanlığı, patron baskısı, Kod-29/25 hilesi ve anayasal hak gaspı.',
    sermayeFraming: 'İşletme optimizasyonu, verimlilik artışı, yeniden yapılanma ve organizasyonel esneklik.'
  }
];

export default function PolarizationView({ polData, onSelectArticle }) {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'logodds', 'blocks'
  const [logOddsData, setLogOddsData] = useState(null);
  const [loadingOdds, setLoadingOdds] = useState(false);

  useEffect(() => {
    if (activeTab === 'logodds' && !logOddsData) {
      setLoadingOdds(true);
      fetchLogOdds({ mode: 'block', a: 'muhalif_bagimsiz', b: 'iktidar_yanlisi', topN: 15 })
        .then(res => setLogOddsData(res))
        .catch(err => console.error('Log-odds hatası:', err))
        .finally(() => setLoadingOdds(false));
    }
  }, [activeTab, logOddsData]);

  const pressBlocks = polData?.press_blocks || [];
  const topPolarized = polData?.highest_polarization_headlines || [];

  return (
    <div>
      {/* 1. Sınıfsal Çerçeveleme Başlığı */}
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Scale size={22} color="var(--red-soviet)" />
              Sınıfsal Söylem, Kutuplaşma & Monroe Log-Odds Motoru
            </h2>
            <p className="panel-desc">
              Emek ve bağımsız basın ile iktidar/sermaye medyasının aynı olayları hangi sınıfsal karşıtlıklarla çerçevelediğinin analizi.
            </p>
          </div>
          <div className="status-badge" style={{ background: 'var(--red-bg)', color: 'var(--yellow-soviet)', borderColor: 'var(--border-red)' }}>
            <span>{pressBlocks.length} Farklı Gazete Bloğu</span>
          </div>
        </div>

        {/* Tab Geçişi */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
            style={{
              background: activeTab === 'matrix' ? 'var(--red-bg)' : 'transparent',
              borderColor: activeTab === 'matrix' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              color: 'var(--white-pure)'
            }}
          >
            <Layers size={16} />
            <span>Sınıfsal Çerçeveleme Karşıtlıkları</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'logodds' ? 'active' : ''}`}
            onClick={() => setActiveTab('logodds')}
            style={{
              background: activeTab === 'logodds' ? 'var(--red-bg)' : 'transparent',
              borderColor: activeTab === 'logodds' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              color: 'var(--white-pure)'
            }}
          >
            <Zap size={16} />
            <span>Canlı Monroe Log-Odds Z-Skorları</span>
          </button>

          <button
            className={`btn-secondary ${activeTab === 'blocks' ? 'active' : ''}`}
            onClick={() => setActiveTab('blocks')}
            style={{
              background: activeTab === 'blocks' ? 'var(--red-bg)' : 'transparent',
              borderColor: activeTab === 'blocks' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              color: 'var(--white-pure)'
            }}
          >
            <Newspaper size={16} />
            <span>Basın Blokları & Kutuplaşma Dağılımı</span>
          </button>
        </div>

        {/* TAB 1: ÇERÇEVELEME KARŞITLIKLARI */}
        {activeTab === 'matrix' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
            {QUALITATIVE_FRAMING_CASES.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(12, 16, 25, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '18px',
                  position: 'relative'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--white-pure)', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  {item.topic}
                </div>

                {/* Emek / Muhalif Çerçeveleme */}
                <div style={{ 
                  background: 'rgba(220, 38, 38, 0.08)', 
                  borderLeft: '3px solid var(--red-soviet)', 
                  padding: '10px 14px', 
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--yellow-soviet)', textTransform: 'uppercase' }}>
                      Emek & Halk Basını Çerçevelemesi
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--white-soft)', lineHeight: 1.5 }}>
                    "{item.emekFraming}"
                  </div>
                </div>

                {/* Sermaye / İktidar Çerçevelemesi */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderLeft: '3px solid #6b7280', 
                  padding: '10px 14px', 
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white-muted)', textTransform: 'uppercase' }}>
                      Sermaye & Piyasa Medyası Çerçevelemesi
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--white-muted)', lineHeight: 1.5 }}>
                    "{item.sermayeFraming}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: CANLI LOG-ODDS */}
        {activeTab === 'logodds' && (
          <div>
            {loadingOdds && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--yellow-soviet)' }}>
                <Loader2 size={24} className="animate-spin" />
                <span>Monroe Log-Odds Dirichlet Prior ile hesaplanıyor...</span>
              </div>
            )}

            {!loadingOdds && logOddsData && (
              <div>
                <div style={{ marginBottom: '14px', fontSize: '0.84rem', color: 'var(--white-muted)' }}>
                  Karşılaştırılan Bloklar: <strong style={{ color: 'var(--yellow-soviet)' }}>{logOddsData.group_a}</strong> vs <strong style={{ color: 'var(--red-soviet-light)' }}>{logOddsData.group_b}</strong>.
                  Pozitif (+) Z-skoru ilk bloğa özgü, negatif (-) Z-skoru ikinci bloğa özgü kelimeleri gösterir.
                </div>

                {logOddsData.sig_count === 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    background: 'rgba(250, 204, 21, 0.08)', 
                    border: '1px solid var(--border-yellow)', 
                    borderRadius: '8px', 
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    color: 'var(--white-soft)'
                  }}>
                    <AlertCircle size={18} color="var(--yellow-soviet)" style={{ flexShrink: 0 }} />
                    <span>Mevcut arşiv hacminde |Z| &ge; 1.96 eşiğini geçen terim bulunamadı. Aşağıda mutlak Z-skoruna göre en yüksek kontrastlı ilk {logOddsData.terms.length} terim gösterilmektedir:</span>
                  </div>
                )}

                <DivergingBars
                  items={logOddsData.terms}
                  leftLabel={logOddsData.group_b}
                  rightLabel={logOddsData.group_a}
                  zThreshold={1.96}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BASIN BLOKLARI DAĞILIMI */}
        {activeTab === 'blocks' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {pressBlocks.map((b, i) => (
                <div 
                  key={i} 
                  style={{ 
                    background: 'rgba(12, 16, 25, 0.85)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--yellow-soviet)' }}>
                      {b.source}
                    </span>
                    <span className="tag-pill">{b.type}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--white-muted)', marginTop: '8px' }}>
                    <span>Toplam Manşet:</span>
                    <strong style={{ color: 'var(--white-pure)', fontFamily: 'var(--font-mono)' }}>{b.total_articles}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--white-muted)', marginTop: '4px' }}>
                    <span>Kutuplaşma Skoru:</span>
                    <strong style={{ color: 'var(--red-soviet-light)', fontFamily: 'var(--font-mono)' }}>%{Math.round(b.polarization_score * 100)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--white-muted)', marginTop: '4px' }}>
                    <span>Duygu Skoru:</span>
                    <strong style={{ color: b.sentiment_score >= 0 ? 'var(--yellow-soviet)' : 'var(--red-soviet-light)', fontFamily: 'var(--font-mono)' }}>
                      {b.sentiment_score >= 0 ? `+${b.sentiment_score}` : b.sentiment_score}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            {/* En Kutuplaşmış Manşetler */}
            {topPolarized.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--white-pure)', marginBottom: '12px' }}>
                  En Yüksek Kutuplaşma Skorlu Örnek Manşetler
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topPolarized.map(art => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArticle && onSelectArticle(art)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(8, 11, 18, 0.75)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--white-pure)', marginBottom: '4px' }}>
                          {art.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--white-dim)', fontFamily: 'var(--font-mono)' }}>
                          {art.source} • {art.date}
                        </div>
                      </div>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '0.8rem', 
                        fontWeight: 800, 
                        color: 'var(--red-soviet-light)',
                        background: 'var(--red-bg)',
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        Kutuplaşma: %{Math.round(art.polarization_score * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
