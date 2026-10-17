import React, { useState } from 'react';
import { Search, HelpCircle, Bookmark, Layers, ArrowRight, RefreshCw, Radio } from 'lucide-react';

export default function Topbar({
  activeTab,
  onSearch,
  searchQuery = '',
  selectedCollection = 'all',
  onSelectCollection,
  onOpenMethods,
  onSyncLive,
  syncingLive = false,
  totalCount = 0,
  savedCount = 0
}) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(localQuery.trim());
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'explore': return 'Keşfet & Arşiv Rehberi';
      case 'workspace': return searchQuery ? `Araştırma: “${searchQuery}”` : 'Zaman Çizgisi & Araştırma';
      case 'collections': return 'Arşiv Koleksiyonları';
      case 'compare': return 'Dönem ve Yayın Karşılaştırması';
      case 'saved': return 'Kaydedilen Araştırmalar';
      case 'methods': return 'Akademik Yöntem ve Modeller';
      default: return 'Arşiv Mercek';
    }
  };

  return (
    <header className="topbar">
      {/* Sol Başlık */}
      <div className="topbar-left">
        <h1 className="topbar-title">{getTitle()}</h1>

        {/* Küresel Arama Kutusu */}
        <form onSubmit={handleSubmit} className="topbar-search-box">
          <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Arşivde kelime, gazete veya dönem arayın (örn: enflasyon, 1994-2001)..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Sağ Eylemler */}
      <div className="topbar-right">
        {/* Canlı RSS Eşitleme Düğmesi */}
        {onSyncLive && (
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'var(--border-line)' }}
            onClick={onSyncLive}
            disabled={syncingLive}
            type="button"
            title="Evrensel, BirGün, Cumhuriyet, Bianet, Gazete Duvar, Bloomberg canlı RSS akışlarını tara"
          >
            <RefreshCw size={14} className={syncingLive ? 'animate-spin' : ''} style={{ color: 'var(--accent-petrol)' }} />
            <span>{syncingLive ? 'Taranıyor...' : 'Canlı Haberleri Tara'}</span>
          </button>
        )}

        {/* Koleksiyon Seçici */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            className="select-box"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
            value={selectedCollection}
            onChange={(e) => onSelectCollection && onSelectCollection(e.target.value)}
          >
            <option value="all">Tüm Külliyat & Canlı ({totalCount > 0 ? totalCount : '...'})</option>
            <option value="tarihsel">Tarihsel Basın</option>
            <option value="ekonomi">Ekonomi ve Krizler</option>
            <option value="siyaset">Siyaset Haberleri</option>
            <option value="emek">Emek ve Sendika</option>
            <option value="kent">Kent ve Yaşam</option>
          </select>
        </div>

        {/* Yöntem / Yardım Düğmesi */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          onClick={onOpenMethods}
          type="button"
          title="Ölçüm ve yöntem açıklamaları"
        >
          <HelpCircle size={15} style={{ color: 'var(--accent-info)' }} />
          <span>Yöntem</span>
        </button>
      </div>
    </header>
  );
}
