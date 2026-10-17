import React from 'react';
import { Compass, Library, LineChart, GitCompare, Bookmark, BookOpen, Database } from 'lucide-react';
import ArsivMercekLogo from './ArsivMercekLogo';

export default function Sidebar({ activeTab, setActiveTab, articleCount = 43, yearCount = 18, savedCount = 0 }) {
  const navItems = [
    { id: 'explore', label: 'Keşfet', icon: Compass, desc: 'Arama, koleksiyonlar ve dönem şeridi' },
    { id: 'workspace', label: 'Zaman Çizgisi', icon: LineChart, desc: 'Filtreler, sıklık serisi ve kaynaklar' },
    { id: 'collections', label: 'Koleksiyonlar', icon: Library, desc: 'Tarihsel, ekonomi, siyaset, emek' },
    { id: 'compare', label: 'Karşılaştır', icon: GitCompare, desc: 'Dönem ve yayın söylem farkları' },
    { id: 'saved', label: 'Kaydedilenler', icon: Bookmark, desc: 'Kayıtlı araştırmalar ve notlar', badge: savedCount > 0 ? savedCount : null },
    { id: 'methods', label: 'Hakkında / Yöntem', icon: BookOpen, desc: 'İstatistiksel yöntemler ve modeller' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo & Marka Başlığı */}
      <div className="sidebar-header">
        <div className="brand-badge" onClick={() => setActiveTab('explore')} title="Arşiv Mercek Ana Sayfa">
          <ArsivMercekLogo size={36} />
          <div className="brand-text-wrap">
            <div className="brand-title">Arşiv <span>Mercek</span></div>
            <div className="brand-subtitle">Basın arşivlerinde zamanın izini sürün</div>
          </div>
        </div>
      </div>

      {/* Ana Gezinme Linkleri */}
      <nav className="sidebar-nav" aria-label="Ana Gezinme">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              type="button"
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-petrol)' : 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge && (
                <span className="badge badge-petrol" style={{ padding: '1px 6px', fontSize: '0.72rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Alt Veri Durumu Kutusu */}
      <div className="sidebar-footer">
        <div className="sidebar-status-box">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontWeight: 600, color: 'var(--text-main)' }}>
            <span className="sidebar-status-dot" />
            <span>Veritabanı İndeksi</span>
          </div>
          <div>{articleCount > 0 ? `${articleCount} kayıt indeksli` : 'Kayıtlar yükleniyor...'}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>1970–2026 · Demo & Canlı RSS</div>
        </div>
      </div>
    </aside>
  );
}
