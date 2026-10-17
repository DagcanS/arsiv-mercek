import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, BookOpen, ExternalLink, Flag } from 'lucide-react';

export default function HeadlineExplorer({ articles, onSelectArticle }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState('ALL');
  const [selectedCrisis, setSelectedCrisis] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  // Benzersiz gazete kaynakları
  const sources = useMemo(() => {
    const set = new Set(articles.map(a => a.source));
    return Array.from(set).sort();
  }, [articles]);

  // Filtreleme mantığı
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      // 1. Arama
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = a.title?.toLowerCase().includes(q);
        const inContent = a.content?.toLowerCase().includes(q);
        const inKeywords = (a.keywords || []).some(k => k.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inKeywords) return false;
      }

      // 2. Kaynak
      if (selectedSource !== 'ALL' && a.source !== selectedSource) return false;

      // 3. Duygu
      if (selectedSentiment !== 'ALL' && a.sentiment_label !== selectedSentiment) return false;

      // 4. Kriz
      if (selectedCrisis !== 'ALL' && a.crisis_category !== selectedCrisis) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'crisis_desc') return (b.crisis_score || 0) - (a.crisis_score || 0);
      if (sortBy === 'pol_desc') return (b.polarization_score || 0) - (a.polarization_score || 0);
      if (sortBy === 'sent_desc') return (b.sentiment_score || 0) - (a.sentiment_score || 0);
      if (sortBy === 'sent_asc') return (a.sentiment_score || 0) - (b.sentiment_score || 0);
      return 0;
    });
  }, [articles, searchTerm, selectedSource, selectedSentiment, selectedCrisis, sortBy]);

  return (
    <div>
      {/* Arama & Filtreleme Çubuğu */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Arama Kutusu */}
          <div style={{ position: 'relative', flex: '1 1 320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--white-dim)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Grev, direniş, devalüasyon, sendika veya gazete ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px' }}
            />
          </div>

          {/* Filtre Dropdownları */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <select
              className="input-field"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="ALL">Tüm Gazeteler ({sources.length})</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="input-field"
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="ALL">Tüm Duygular</option>
              <option value="pozitif">Pozitif / Dinamizm</option>
              <option value="nötr">Nötr</option>
              <option value="negatif">Negatif / Kriz</option>
            </select>

            <select
              className="input-field"
              value={selectedCrisis}
              onChange={(e) => setSelectedCrisis(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="ALL">Tüm Kriz Eksenleri</option>
              <option value="kur">Döviz / Devalüasyon</option>
              <option value="enflasyon">Enflasyon / Zam</option>
              <option value="faiz">Faiz / Likidite</option>
              <option value="borc_imf">Borç / IMF / İflas</option>
              <option value="siyasi_kriz">Siyasal Gerilim</option>
            </select>

            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="date_desc">En Yeni Tarih</option>
              <option value="date_asc">En Eski Tarih (1970'ten)</option>
              <option value="crisis_desc">En Yüksek Kriz Skoru</option>
              <option value="pol_desc">En Yüksek Kutuplaşma</option>
              <option value="sent_desc">En Yüksek Direniş / Umut</option>
            </select>
          </div>
        </div>

        {/* Sonuç Sayısı Özeti */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--white-muted)' }}>
          <span>Taranan Manşet: <strong style={{ color: 'var(--white-pure)' }}>{filteredArticles.length}</strong> / {articles.length}</span>
          {(searchTerm || selectedSource !== 'ALL' || selectedSentiment !== 'ALL' || selectedCrisis !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedSource('ALL'); setSelectedSentiment('ALL'); setSelectedCrisis('ALL'); }}
              style={{ background: 'none', border: 'none', color: 'var(--yellow-soviet)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Makale Izgarası */}
      {filteredArticles.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--white-muted)' }}>
          <BookOpen size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: 'var(--red-soviet)' }} />
          <h3>Arama kriterlerine uygun basın manşeti bulunamadı.</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Lütfen arama terimini veya seçtiğiniz filtreleri değiştirin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
          {filteredArticles.map((art) => (
            <div key={art.id} className="newspaper-headline-card">
              <div>
                <div className="newspaper-masthead">
                  <span className="newspaper-name">{art.source}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="tag-pill">{art.category}</span>
                    <span className="newspaper-date">{art.date}</span>
                  </div>
                </div>

                <h3 className="article-headline">{art.title}</h3>
                <p className="article-content">{art.content}</p>
              </div>

              <div>
                {art.keywords && art.keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {art.keywords.slice(0, 4).map((kw, idx) => (
                      <span key={idx} className="tag-pill" style={{ fontSize: '0.7rem' }}>
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  <span className={`badge ${art.sentiment_score >= 0 ? 'badge-pos' : 'badge-neg'}`}>
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

                <div style={{ display: 'grid', gridTemplateColumns: (art.url || art.image_url?.startsWith('http')) ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    style={{ justifyContent: 'center' }}
                    onClick={() => onSelectArticle(art)}
                  >
                    <span>Söylem İncele</span>
                  </button>
                  {(art.url || art.image_url?.startsWith('http')) && (
                    <a
                      href={art.url || art.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        padding: '6px 10px',
                        borderRadius: '4px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Haberi Oku</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
