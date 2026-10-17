import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ExploreView from './components/ExploreView';
import ResearchWorkspace from './components/ResearchWorkspace';
import CompareView from './components/CompareView';
import CollectionsView from './components/CollectionsView';
import SavedInvestigationsView from './components/SavedInvestigationsView';
import MethodsView from './components/MethodsView';
import ArticleModal from './components/ArticleModal';
import ArchiveScanner from './components/ArchiveScanner';

import {
  fetchOverviewStats,
  fetchArticles,
  fetchCrisisRadar,
  fetchPolarizationData,
  fetchEngineInfo,
  fetchClassDualAxisTimeline,
  syncLiveRss
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'workspace', 'collections', 'compare', 'saved', 'methods'
  const [searchQuery, setSearchQuery] = useState('enflasyon');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Veri State
  const [stats, setStats] = useState(null);
  const [engine, setEngine] = useState(null);
  const [articles, setArticles] = useState([]);
  const [dualAxisData, setDualAxisData] = useState(null);
  const [syncingLive, setSyncingLive] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  const [savedList, setSavedList] = useState(() => {
    try {
      const stored = localStorage.getItem('arsiv_saved_investigations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // İlk Veri Yükleme
  const loadInitialData = async () => {
    try {
      const [s, a, eng, dual] = await Promise.all([
        fetchOverviewStats(),
        fetchArticles({ limit: 500 }),
        fetchEngineInfo(),
        fetchClassDualAxisTimeline()
      ]);
      setStats(s);
      setArticles(a?.articles || []);
      setEngine(eng);
      setDualAxisData(dual);
    } catch (err) {
      console.error('Arşiv verileri yüklenirken hata:', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Canlı Haber Eşitleme
  const handleSyncLive = async () => {
    try {
      setSyncingLive(true);
      const res = await syncLiveRss(40);
      if (res && res.success) {
        setSyncNotice(`${res.total_added} yeni canlı haber çekildi! Toplam ${res.total_articles} haber indekslendi.`);
        await loadInitialData();
      }
    } catch (err) {
      console.error('Canlı haber eşitleme hatası:', err);
      setSyncNotice('Canlı haberler çekilirken bağlantı hatası oluştu.');
    } finally {
      setSyncingLive(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  // Küresel Arama Tetikleyicisi
  const handleTriggerSearch = (query) => {
    setSearchQuery(query);
    setActiveTab('workspace');
  };

  // Araştırma Kaydetme
  const handleSaveInvestigation = (inv) => {
    setSavedList(prev => {
      const updated = [inv, ...prev];
      try {
        localStorage.setItem('arsiv_saved_investigations', JSON.stringify(updated));
      } catch (e) {
        console.warn('Araştırma saklanamadı:', e);
      }
      return updated;
    });
  };

  // Kayıt Silme
  const handleDeleteSaved = (index) => {
    setSavedList(prev => {
      const updated = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem('arsiv_saved_investigations', JSON.stringify(updated));
      } catch (e) {
        console.warn('Araştırma silinemedi:', e);
      }
      return updated;
    });
  };

  return (
    <div className="app-shell">
      {/* 1. Sol Sabit Gezinme */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        articleCount={articles.length || stats?.total_articles || 0}
        yearCount={stats?.year_range ? (stats.year_range.max - stats.year_range.min + 1) : 0}
        savedCount={savedList.length}
      />

      {/* 2. Ana Çalışma Alanı */}
      <div className="main-wrapper">
        {/* Üst Bağlam Çubuğu */}
        <Topbar
          activeTab={activeTab}
          onSearch={handleTriggerSearch}
          searchQuery={searchQuery}
          selectedCollection={selectedCollection}
          onSelectCollection={(col) => {
            setSelectedCollection(col);
            if (col !== 'all') {
              handleTriggerSearch(col === 'emek' ? 'grev' : col);
            }
          }}
          onOpenMethods={() => setActiveTab('methods')}
          onSyncLive={handleSyncLive}
          syncingLive={syncingLive}
          totalCount={articles.length || stats?.total_articles || 0}
          savedCount={savedList.length}
        />

        {/* Canlı Eşitleme Bildirim Bandı */}
        {syncNotice && (
          <div style={{
            background: 'var(--accent-petrol)',
            color: '#FFFFFF',
            padding: '10px 20px',
            fontSize: '0.84rem',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span>⚡ {syncNotice}</span>
            <button
              type="button"
              onClick={() => setSyncNotice(null)}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Ana Sayfa İçeriği */}
        <main className="page-container">
          {loading ? (
            <ArchiveScanner
              message="Veritabanı dizinleri ve canlı haber akışları taranıyor..."
              hint="Örnek tarihsel benchmark kayıtları ve canlı RSS verileri NLP hattında işleniyor"
            />
          ) : (
            <>
              {/* 1. Keşfet Ekranı */}
              {activeTab === 'explore' && (
                <ExploreView
                  onTriggerSearch={handleTriggerSearch}
                  onSelectArticle={setSelectedArticle}
                  recentArticles={articles}
                />
              )}

              {/* 2. Zaman Çizgisi & Araştırma Çalışma Alanı */}
              {activeTab === 'workspace' && (
                <ResearchWorkspace
                  initialQuery={searchQuery}
                  articles={articles}
                  dualAxisData={dualAxisData}
                  onSelectArticle={setSelectedArticle}
                  onSaveInvestigation={handleSaveInvestigation}
                  onSyncLive={handleSyncLive}
                  syncingLive={syncingLive}
                />
              )}

              {/* 3. Koleksiyonlar Ekranı */}
              {activeTab === 'collections' && (
                <CollectionsView
                  onSelectCollectionQuery={handleTriggerSearch}
                />
              )}

              {/* 4. Karşılaştır Ekranı */}
              {activeTab === 'compare' && (
                <CompareView
                  articles={articles}
                  onSelectArticle={setSelectedArticle}
                />
              )}

              {/* 5. Kaydedilenler Ekranı */}
              {activeTab === 'saved' && (
                <SavedInvestigationsView
                  savedList={savedList}
                  onRunSaved={handleTriggerSearch}
                  onDeleteSaved={handleDeleteSaved}
                />
              )}

              {/* 6. Hakkında / Yöntem Ekranı */}
              {activeTab === 'methods' && (
                <MethodsView
                  engine={engine}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Özgün Belge İnceleme Modalı */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
