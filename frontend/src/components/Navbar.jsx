import React from 'react';
import { Newspaper, Activity, Flame, Scale, Search, Cpu, Flag, Sigma } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, totalArticles = 43, engine }) {
  const tabs = [
    { id: 'timeline', label: 'Zaman Tüneli', icon: Activity },
    { id: 'crisis', label: 'Kriz Radarı', icon: Flame },
    { id: 'polarization', label: 'Kutuplaşma & Çerçeveleme', icon: Scale },
    { id: 'stats', label: 'İstatistik Motoru', icon: Sigma },
    { id: 'explorer', label: 'Basın Arşivi', icon: Newspaper },
    { id: 'lab', label: 'NLP & OCR Lab', icon: Cpu }
  ];

  const backendName = engine?.sentiment_backend || 'Sözlük-Tabanlı (lexicon)';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Flag size={24} />
          </div>
          <div>
            <div className="brand-title">Medya<span>Tarih</span></div>
            <div className="brand-subtitle">Tarihsel Basın & Söylem Analizi Motoru</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="status-badge">
          <div className="status-dot"></div>
          <span>{backendName} • {totalArticles} Manşet</span>
        </div>
      </div>
    </header>
  );
}
