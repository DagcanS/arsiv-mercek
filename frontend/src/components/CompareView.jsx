import React, { useState, useEffect } from 'react';
import { GitCompare, Calendar, Newspaper, ArrowRight, Info, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { fetchLogOdds } from '../services/api';
import DivergingBars from './charts/DivergingBars';

const PERIOD_PRESETS = [
  {
    id: 'kriz_vs_yakin',
    label: '1994–2001 vs 2020–2026 (Tarihsel Kriz vs Yakın Dönem)',
    labelA: '1994–2001 (5 Nisan & Banka Batıkları)',
    labelB: '2020–2026 (Yakın Dönem & Enflasyon)',
    aFrom: 1994,
    aTo: 2001,
    bFrom: 2020,
    bTo: 2026
  },
  {
    id: 'erken_vs_doksanlar',
    label: '1970–1989 vs 1990–2001 (Bahar Eylemleri vs 90’lar Krizleri)',
    labelA: '1970–1989 (Bahar Eylemleri & Erken Dönem)',
    labelB: '1990–2001 (5 Nisan & Koalisyonlar)',
    aFrom: 1970,
    aTo: 1989,
    bFrom: 1990,
    bTo: 2001
  },
  {
    id: 'buyume_vs_yakin',
    label: '2003–2019 vs 2020–2026 (2000’ler vs Güncel Enflasyon)',
    labelA: '2003–2019 (Tek Parti & Göreli İstikrar)',
    labelB: '2020–2026 (Pandemi, Kur Şoku & Güncel Kriz)',
    aFrom: 2003,
    aTo: 2019,
    bFrom: 2020,
    bTo: 2026
  },
  {
    id: 'emek_tarihsel_vs_guncel',
    label: '1970–1991 vs 2020–2026 (Tarihsel Emek vs Güncel Mücadele)',
    labelA: '1970–1991 (15-16 Haziran & Zonguldak Yürüyüşü)',
    labelB: '2020–2026 (Güncel Grev & Geçim Mücadelesi)',
    aFrom: 1970,
    aTo: 1991,
    bFrom: 2020,
    bTo: 2026
  },
  {
    id: 'custom',
    label: 'Özel Tarih Aralığı (Serbest Seçim)',
    labelA: 'Özel Dönem A',
    labelB: 'Özel Dönem B',
    aFrom: 1994,
    aTo: 2001,
    bFrom: 2020,
    bTo: 2026
  }
];

const PRESS_BLOCKS = [
  { id: 'muhalif_vs_iktidar', labelA: 'Muhalif & Emek Basını', labelB: 'İktidar & Sermaye Medyası', blockA: 'muhalif_bagimsiz', blockB: 'iktidar_yanlisi' },
  { id: 'merkez_vs_ekonomi', labelA: 'Merkez / Ana Akım Basın', labelB: 'Ekonomi Basını', blockA: 'merkez', blockB: 'ekonomi' },
  { id: 'muhalif_vs_ekonomi', labelA: 'Muhalif & Emek Basını', labelB: 'Ekonomi Basını', blockA: 'muhalif_bagimsiz', blockB: 'ekonomi' }
];

export default function CompareView({ articles = [], onSelectArticle }) {
  const [compareMode, setCompareMode] = useState('period'); // 'period' or 'block'
  const [selectedPreset, setSelectedPreset] = useState(PERIOD_PRESETS[0]);

  // Özel Tarih Aralığı State'leri
  const [customAFrom, setCustomAFrom] = useState(1994);
  const [customATo, setCustomATo] = useState(2001);
  const [customBFrom, setCustomBFrom] = useState(2020);
  const [customBTo, setCustomBTo] = useState(2026);

  const [selectedBlock, setSelectedBlock] = useState(PRESS_BLOCKS[0]);
  const [logOddsResult, setLogOddsResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const isCustomPeriod = compareMode === 'period' && selectedPreset.id === 'custom';

  const executeComparison = () => {
    setLoading(true);
    let params;
    if (compareMode === 'period') {
      const aRange = isCustomPeriod ? `${customAFrom}-${customATo}` : `${selectedPreset.aFrom}-${selectedPreset.aTo}`;
      const bRange = isCustomPeriod ? `${customBFrom}-${customBTo}` : `${selectedPreset.bFrom}-${selectedPreset.bTo}`;
      params = {
        mode: 'period',
        a: aRange,
        b: bRange,
        topN: 14
      };
    } else {
      params = {
        mode: 'block',
        a: selectedBlock.blockA,
        b: selectedBlock.blockB,
        topN: 14
      };
    }

    fetchLogOdds(params)
      .then(res => setLogOddsResult(res))
      .catch(err => console.error('Karşılaştırma hatası:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    executeComparison();
  }, [compareMode, selectedPreset, selectedBlock]);

  const leftLabel = compareMode === 'period'
    ? (isCustomPeriod ? `${customBFrom}–${customBTo} Dönemi` : selectedPreset.labelB)
    : selectedBlock.labelB;

  const rightLabel = compareMode === 'period'
    ? (isCustomPeriod ? `${customAFrom}–${customATo} Dönemi` : selectedPreset.labelA)
    : selectedBlock.labelA;

  return (
    <div>
      {/* Karşılaştırma Üst Başlığı */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">
              <GitCompare size={22} style={{ color: 'var(--accent-petrol)' }} />
              Dönem ve Söylem Karşılaştırması
            </h2>
            <p className="card-desc">
              İki farklı tarihsel dönem veya yayın bloğu arasındaki sözcük dağılımı farklarını Monroe Log-Odds (Dirichlet Prior) ile deşifre edin.
            </p>
          </div>

          {/* Mod Seçimi */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${compareMode === 'period' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCompareMode('period')}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <Calendar size={14} />
              <span>Tarih Aralığına Göre</span>
            </button>
            <button
              type="button"
              className={`btn ${compareMode === 'block' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCompareMode('block')}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <Newspaper size={14} />
              <span>Yayın Blokları Arası</span>
            </button>
          </div>
        </div>

        {/* Parametre Seçiciler */}
        <div style={{
          background: '#FAF9F5',
          border: '1px solid var(--border-line)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {compareMode === 'period' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hazır Dönem Çiftleri:</span>
                {PERIOD_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`btn-chip ${selectedPreset.id === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedPreset(p)}
                  >
                    {p.id === 'custom' ? '⚙️ Özel Aralık Belirle' : p.label.split('(')[0].trim()}
                  </button>
                ))}
              </div>

              {/* Serbest Tarih Aralığı Seçicisi */}
              {isCustomPeriod && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr auto',
                  gap: '14px',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-line)',
                  marginTop: '10px'
                }}>
                  {/* Dönem A */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent-petrol)', marginBottom: '4px' }}>
                      1. Dönem (Pozitif Z):
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1970"
                        max="2026"
                        className="input-text"
                        style={{ width: '90px', padding: '4px 8px' }}
                        value={customAFrom}
                        onChange={(e) => setCustomAFrom(parseInt(e.target.value) || 1970)}
                      />
                      <span>—</span>
                      <input
                        type="number"
                        min="1970"
                        max="2026"
                        className="input-text"
                        style={{ width: '90px', padding: '4px 8px' }}
                        value={customATo}
                        onChange={(e) => setCustomATo(parseInt(e.target.value) || 2026)}
                      />
                    </div>
                  </div>

                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>VS</span>

                  {/* Dönem B */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent-kiremit)', marginBottom: '4px' }}>
                      2. Dönem (Negatif Z):
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1970"
                        max="2026"
                        className="input-text"
                        style={{ width: '90px', padding: '4px 8px' }}
                        value={customBFrom}
                        onChange={(e) => setCustomBFrom(parseInt(e.target.value) || 1970)}
                      />
                      <span>—</span>
                      <input
                        type="number"
                        min="1970"
                        max="2026"
                        className="input-text"
                        style={{ width: '90px', padding: '4px 8px' }}
                        value={customBTo}
                        onChange={(e) => setCustomBTo(parseInt(e.target.value) || 2026)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                    onClick={executeComparison}
                  >
                    <span>Karşılaştır</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Yayın Blokları:</span>
              {PRESS_BLOCKS.map(b => (
                <button
                  key={b.id}
                  type="button"
                  className={`btn-chip ${selectedBlock.id === b.id ? 'active' : ''}`}
                  onClick={() => setSelectedBlock(b)}
                >
                  {b.labelA} vs {b.labelB}
                </button>
              ))}
            </div>
          )}

          {/* Renk ve Örneklem Lejantı */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECEAE4', paddingTop: '10px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--accent-petrol)', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {rightLabel} {logOddsResult?.docs_a !== undefined ? `(n=${logOddsResult.docs_a} haber)` : ''} (Pozitif Z)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--accent-kiremit)', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {leftLabel} {logOddsResult?.docs_b !== undefined ? `(n=${logOddsResult.docs_b} haber)` : ''} (Negatif Z)
                </span>
              </div>
            </div>

            <span className="badge badge-neutral" style={{ fontSize: '0.74rem' }}>
              Dirichlet Prior Normalizasyonu · Sözlük Boyutu: {logOddsResult?.vocab_size || 0}
            </span>
          </div>
        </div>
      </div>

      {/* İki Yana Açılan Çubuk Grafik (Diverging Bars) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Sözcük Ayrışma Skoru (Monroe Log-Odds Z-Skoru)</h3>
            <p className="card-desc">
              Merkezdeki sıfır ekseninin sağı petrol rengiyle birinci seriye, solu kiremit rengiyle ikinci seriye özgü sözcükleri gösterir.
            </p>
          </div>
          <span className="badge badge-neutral">Eşik: |Z| &ge; 1.96 (p &lt; 0.05)</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', gap: '10px', color: 'var(--text-secondary)' }}>
            <Loader2 size={20} className="animate-spin" />
            <span>Monroe Log-Odds karşılaştırması hesaplanıyor...</span>
          </div>
        ) : logOddsResult && ((logOddsResult.a_terms && logOddsResult.a_terms.length > 0) || (logOddsResult.b_terms && logOddsResult.b_terms.length > 0) || (logOddsResult.terms && logOddsResult.terms.length > 0)) ? (
          <div>
            {(logOddsResult.significant_count === 0 || logOddsResult.sig_count === 0) && (
              <div className="notice-warning" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Mevcut örneklemde |Z| &ge; 1.96 eşiğini geçen sözcükler belirgindir. Aşağıda iki dönem/blok arasındaki en yüksek kontrastlı terimler listelenmektedir.
                </span>
              </div>
            )}

            <DivergingBars
              leftItems={logOddsResult.b_terms || []}
              rightItems={logOddsResult.a_terms || []}
              items={logOddsResult.terms}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              zThreshold={1.96}
            />
          </div>
        ) : (
          <div className="state-box">
            <p className="state-desc">Bu karşılaştırma için seçili dönemlerde yeterli sözcük ayrışması bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Yayınlar ve Dönemler Dağılım Matrisi */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Yayınlar Arası Tarihsel ve Güncel Dağılım Matrisi</h3>
            <p className="card-desc">
              1970'lerden 2026 güncel canlı haberlerine kadar arşivdeki belge ve manşet yoğunluğu.
            </p>
          </div>
          <span className="badge badge-petrol">{articles.length} Toplam Kayıt</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="research-table">
            <thead>
              <tr>
                <th>Yayın Adı</th>
                <th>1970–1989</th>
                <th>1990–1999</th>
                <th>2000–2009</th>
                <th>2010–2019</th>
                <th>2020–2026 (Yakın Dönem & Canlı)</th>
                <th>Toplam Nüsha</th>
              </tr>
            </thead>
            <tbody>
              {['Evrensel', 'BirGün', 'Cumhuriyet', 'Bianet', 'Gazete Duvar', 'BloombergHT', 'NTV Ekonomi', 'Sol Haber', 'Hürriyet', 'Milliyet', 'Sabah', 'Dünya'].map((pub) => {
                const pubArticles = articles.filter(a => a.source.toLowerCase().includes(pub.toLowerCase()));
                const d1 = pubArticles.filter(a => a.year >= 1970 && a.year <= 1989).length;
                const d2 = pubArticles.filter(a => a.year >= 1990 && a.year <= 1999).length;
                const d3 = pubArticles.filter(a => a.year >= 2000 && a.year <= 2009).length;
                const d4 = pubArticles.filter(a => a.year >= 2010 && a.year <= 2019).length;
                const d5 = pubArticles.filter(a => a.year >= 2020 && a.year <= 2026).length;
                return (
                  <tr key={pub}>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-serif)' }}>{pub}</td>
                    <td><span className="badge badge-neutral">{d1}</span></td>
                    <td><span className="badge badge-neutral">{d2}</span></td>
                    <td><span className="badge badge-neutral">{d3}</span></td>
                    <td><span className="badge badge-neutral">{d4}</span></td>
                    <td>
                      <span className={`badge ${d5 > 0 ? 'badge-petrol' : 'badge-neutral'}`}>
                        {d5} canlı haber
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-petrol)' }}>{pubArticles.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
