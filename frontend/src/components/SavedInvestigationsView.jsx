import React from 'react';
import { Bookmark, Calendar, ArrowRight, Trash2, Search, ExternalLink } from 'lucide-react';

export default function SavedInvestigationsView({ savedList = [], onRunSaved, onDeleteSaved }) {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">
              <Bookmark size={22} style={{ color: 'var(--accent-petrol)' }} />
              Kaydedilen Araştırmalar
            </h2>
            <p className="card-desc">
              Daha önce incelediğiniz arama terimleri, tarih filtreleri ve kaynak kapsamlarını saklayın ve tek tıkla tekrar çalıştırın.
            </p>
          </div>
          <span className="badge badge-neutral">{savedList.length} Kayıtlı Araştırma</span>
        </div>

        {savedList.length === 0 ? (
          <div className="state-box">
            <div className="state-icon" style={{ background: 'var(--bg-canvas)', color: 'var(--text-muted)' }}>
              <Bookmark size={24} />
            </div>
            <h4 className="state-title">Henüz kaydedilmiş araştırma bulunmuyor</h4>
            <p className="state-desc">
              Çalışma alanında herhangi bir sorgu çalıştırdıktan sonra sağ üstteki “Araştırmayı Kaydet” butonuna tıklayarak buraya ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savedList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      “{item.query}”
                    </span>
                    <span className="badge badge-petrol">{item.years}</span>
                    <span className="badge badge-neutral">{item.publication || 'Tüm Yayınlar'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Kayıt Tarihi: {item.savedAt} • {item.resultCount} ilgili nüsha tespit edilmişti
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                    onClick={() => onRunSaved && onRunSaved(item.query)}
                  >
                    <span>Yeniden Çalıştır</span>
                    <ArrowRight size={14} />
                  </button>
                  {onDeleteSaved && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', color: 'var(--accent-kiremit)' }}
                      onClick={() => onDeleteSaved(idx)}
                      title="Kaydı sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
