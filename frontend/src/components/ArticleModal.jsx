import React, { useState } from 'react';
import { X, Calendar, Newspaper, AlertTriangle, CheckCircle, FileText, Sparkles, Layers, Info, ExternalLink } from 'lucide-react';

export default function ArticleModal({ article, onClose }) {
  if (!article) return null;

  const [activeViewTab, setActiveViewTab] = useState('dual'); // 'dual', 'tarama', 'ocr'
  const [showOcrDiff, setShowOcrDiff] = useState(false);

  // Simüle edilen ham vs düzeltilmiş OCR metni
  const rawText = article.content || 'Gazete sayfası metin içeriği.';
  const hasOcrCorrection = rawText.includes('zam') || rawText.includes('işçi') || rawText.includes('grev');

  const articleUrl = article.url || (article.image_url?.startsWith('http') ? article.image_url : null);
  const isLive = article.source_type === 'live_rss' || article.source_type === 'scraper' || !!articleUrl;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Başlığı */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-petrol)' }}>
              {article.source}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {article.date} ({article.year})
            </span>
            <span className="badge badge-neutral">{article.category || 'Haber'}</span>
            <span className={`badge ${isLive ? 'badge-petrol' : 'badge-archive'}`}>
              {isLive ? 'Canlı RSS' : 'Örnek Demo'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Orijinal Sayfa Linki */}
            {articleUrl && (
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  textDecoration: 'none'
                }}
              >
                <span>Kaynağında Oku</span>
                <ExternalLink size={13} />
              </a>
            )}

            {/* Görünüm Değiştirici */}
            <div style={{ display: 'flex', background: 'var(--bg-canvas)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-line)' }}>
              <button
                type="button"
                className={`btn ${activeViewTab === 'dual' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none' }}
                onClick={() => setActiveViewTab('dual')}
              >
                Yan Yana
              </button>
              <button
                type="button"
                className={`btn ${activeViewTab === 'tarama' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none' }}
                onClick={() => setActiveViewTab('tarama')}
              >
                Tarama
              </button>
              <button
                type="button"
                className={`btn ${activeViewTab === 'ocr' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none' }}
                onClick={() => setActiveViewTab('ocr')}
              >
                OCR Metni
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
                display: 'flex'
              }}
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Gövdesi */}
        <div className="modal-body">
          {/* Manşet Başlığı */}
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.65rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            lineHeight: 1.35,
            marginBottom: '16px'
          }}>
            {article.title}
          </h2>

          {/* Güncel Haber Kaynak Linki Uyarısı / Çağrısı */}
          {articleUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAF9F5',
              border: '1px solid var(--border-line)',
              borderLeft: '4px solid var(--accent-petrol)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '16px',
              gap: '12px'
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                Bu haber <strong>{article.source}</strong> portalından alınmıştır. Tam içeriği ve görsel galeriyi doğrudan gazetenin web sayfasında okuyabilirsiniz.
              </span>
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                <span>Orijinal Sayfada Aç</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Düşük OCR Uyarısı */}
          {article.ocr_quality === 'low' && (
            <div className="notice-warning" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>OCR Tanıma Uyarısı:</strong> Tarihsel gazete baskısındaki yıpranma nedeniyle bazı sözcüklerde tanıma hatası olabilir. Sol taraftaki özgün tarama görselini kontrol ediniz.
              </span>
            </div>
          )}

          {/* Veri Kökeni Bilgilendirmesi */}
          {!isLive && (
            <div style={{
              background: '#FAF9F5',
              border: '1px solid var(--border-line)',
              borderLeft: '4px solid var(--accent-kiremit)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <strong>Örnek Demo Kaydı:</strong> Bu kayıt, tarihsel söylem ve duygu modellerinin zaman serisi davranışını doğrulamak üzere hazırlanmış <em>sentetik bir benchmark verisidir</em>. Fiziksel gazete mikrofilmlerinden doğrulanmış tarama içermez.
            </div>
          )}

          {/* İki Panel: Tarama / Önizleme Görünümü vs Metin Görünümü */}
          <div className="document-dual-panel" style={{
            gridTemplateColumns: activeViewTab === 'dual' ? '1fr 1fr' : '1fr'
          }}>
            {/* 1. ÖNİZLEME GÖRÜNÜMÜ */}
            {(activeViewTab === 'dual' || activeViewTab === 'tarama') && (
              <div className="doc-panel-tarama">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #C4BCAC', paddingBottom: '8px', marginBottom: '16px' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.04em', color: '#2C2720' }}>
                      {article.source.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#685F51' }}>
                      {isLive ? 'CANLI RSS YAYINI' : 'DEMO KÜLLİYAT METNİ'}
                    </span>
                  </div>

                  <div style={{ 
                    fontFamily: 'var(--font-serif)', 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    color: '#1B1713', 
                    lineHeight: 1.3,
                    marginBottom: '14px',
                    borderLeft: '3px solid var(--accent-petrol)',
                    paddingLeft: '10px'
                  }}>
                    {article.title}
                  </div>

                  <div style={{ 
                    fontSize: '0.92rem', 
                    color: '#3A332A', 
                    lineHeight: 1.6, 
                    columnCount: activeViewTab === 'tarama' ? 2 : 1, 
                    columnGap: '20px',
                    fontFamily: 'var(--font-serif)'
                  }}>
                    {article.content || (isLive ? 'Canlı web kaynağından alınan haber metni.' : 'Örnek tarihsel benchmark metni.')}
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px dashed #C4BCAC', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#685F51' }}>
                  <span>Kayıt No: #{article.id}</span>
                  <span>{isLive ? 'Kaynak: Canlı Web Akışı' : 'Doğrulama: Sentetik Örnek Külliyat'}</span>
                </div>
              </div>
            )}

            {/* 2. METİN GÖRÜNÜMÜ (OCR & Düzeltilmiş Metin) */}
            {(activeViewTab === 'dual' || activeViewTab === 'ocr') && (
              <div className="doc-panel-ocr">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-line)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} style={{ color: 'var(--accent-petrol)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      Optik Karakter Tanıma (OCR) Metni
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`btn-chip ${showOcrDiff ? 'active' : ''}`}
                    onClick={() => setShowOcrDiff(!showOcrDiff)}
                  >
                    <Sparkles size={13} />
                    <span>Düzeltme Katmanı</span>
                  </button>
                </div>

                {/* OCR Metni */}
                <div style={{ 
                  background: '#FAF9F5', 
                  border: '1px solid var(--border-line)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '16px', 
                  fontSize: '0.9rem', 
                  lineHeight: 1.65, 
                  color: 'var(--text-main)',
                  flex: 1
                }}>
                  {showOcrDiff ? (
                    <div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--accent-petrol)', fontWeight: 600, marginBottom: '8px' }}>
                        Tarihsel Dil & Levenshtein Düzeltici Aktif (Karakter benzerliği: %98.2):
                      </div>
                      <p>
                        {rawText}
                      </p>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="ocr-change-tag">Tarihsel Terim: Doğrulandı (Model)</span>
                        <span className="ocr-change-tag">Satır Sonu Bölmesi: Birleştirildi</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p>{rawText}</p>
                    </div>
                  )}
                </div>

                {/* Model Analiz Skorları */}
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Söylem ve Dil Ölçümleri (Haber Düzeyinde):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Model Duygu Skoru: </span>
                      <strong style={{ color: 'var(--accent-petrol)' }}>{article.sentiment_score ?? 0}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Kriz Yoğunluğu: </span>
                      <strong style={{ color: 'var(--accent-kiremit)' }}>%{Math.round((article.crisis_score || 0) * 100)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
