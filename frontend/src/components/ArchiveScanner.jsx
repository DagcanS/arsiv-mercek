import React from 'react';

/**
 * Arşiv Mercek — Belge Tarama ve Metne Dönüşüm Yükleme Bileşeni
 */
export default function ArchiveScanner({ message = 'Arşiv kayıtları inceleniyor ve zaman dizinine bağlanıyor...', hint = 'Kaynaklar, OCR metinleri ve frekans dizinleri taranıyor' }) {
  return (
    <div className="archive-scanner-container" role="status" aria-live="polite">
      <div className="scanner-sheet">
        {/* Hareketli Tarama Işık Çizgisi */}
        <div className="scanner-beam" />

        {/* Belge Başlık Çizgisi */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ width: '42px', height: '6px', background: '#DCD9D1', borderRadius: '2px' }} />
          <div style={{ width: '28px', height: '5px', background: '#E8E1D5', borderRadius: '2px' }} />
        </div>

        {/* Satırlar */}
        <div className="scanner-text-line" />
        <div className="scanner-text-line short" />
        
        {/* Vurgulanan Terim Satırı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '40px', height: '7px', background: '#E8E5DC', borderRadius: '3px' }} />
          <span className="scanner-highlight-word" />
          <div style={{ flex: 1, height: '7px', background: '#E8E5DC', borderRadius: '3px' }} />
        </div>

        <div className="scanner-text-line mid" />

        {/* Alt Zaman Çizgisi Bağlantı Noktası */}
        <div style={{ 
          marginTop: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          borderTop: '1px dashed #DCD9D1', 
          paddingTop: '6px' 
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-kiremit)' }} />
          <div style={{ width: '50px', height: '3px', background: 'var(--accent-petrol)', borderRadius: '2px' }} />
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-petrol)' }} />
          <div style={{ flex: 1, height: '1px', background: '#DCD9D1' }} />
        </div>
      </div>

      <div className="scanner-message">{message}</div>
      <div className="scanner-hint">{hint}</div>
    </div>
  );
}
