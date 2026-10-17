import React from 'react';
import { Library, ArrowRight, FileText, Calendar, Database, ShieldCheck, TrendingUp, Users } from 'lucide-react';

const COLLECTIONS_DETAILED = [
  {
    id: 'tarihsel',
    title: 'Tarihsel Basın Koleksiyonu',
    desc: 'Türkiye’nin çok partili siyasi hayatı, askeri müdahaleler, seçimler ve dış politika manşetlerinin dönemsel izi.',
    years: '1970 — 2024',
    publications: ['Cumhuriyet', 'Milliyet', 'Hürriyet', 'Tercüman', 'Güneş'],
    docCount: 18,
    highlight: '15-16 Haziran 1970, 24 Ocak 1980 ve 1990’lar koalisyon haberleri',
    tag: 'Genel Basın'
  },
  {
    id: 'ekonomi',
    title: 'Ekonomi ve Krizler Koleksiyonu',
    desc: 'Devalüasyon kararları, IMF stand-by anlaşmaları, döviz kuru patlamaları, banka fonlama krizleri ve hiperenflasyon dönemleri.',
    years: '1970 — 2024',
    publications: ['Dünya', 'Cumhuriyet', 'Hürriyet', 'Milliyet', 'Sabah'],
    docCount: 19,
    highlight: '5 Nisan 1994, 2001 Banka Batıkları, 2018 Rahip Brunson Şoku, 2021 KKM',
    tag: 'Makroekonomi'
  },
  {
    id: 'siyaset',
    title: 'Siyaset ve Hükümet Krizleri Koleksiyonu',
    desc: 'Meclis krizleri, anayasa kitapçığı gerilimleri, erken seçim beyannameleri ve koalisyon protokolleri.',
    years: '1970 — 2024',
    publications: ['Cumhuriyet', 'Hürriyet', 'Yeni Şafak', 'Zaman', 'Sabah'],
    docCount: 14,
    highlight: '28 Şubat 1997, 2001 Anayasa Fırlatma, 2002 Erken Seçim Tasfiyesi',
    tag: 'Siyaset'
  },
  {
    id: 'emek',
    title: 'Emek ve Sendika Basını Koleksiyonu',
    desc: 'Grev kararları, fabrika direnişleri, toplu sözleşme tıkanmaları, kıdem tazminatı ve asgari ücret tartışmaları.',
    years: '1970 — 2024',
    publications: ['Evrensel', 'BirGün', 'Sendika.org', 'Cumhuriyet', 'Aydınlık'],
    docCount: 11,
    highlight: '1989 Bahar Eylemleri, 1991 Zonguldak Yürüyüşü, 2010 TEKEL Direnişi, 2015 Metal Fırtına',
    tag: 'Emek & Haklar'
  },
  {
    id: 'kent',
    title: 'Kent, Tüketici ve Gündelik Yaşam',
    desc: 'Hayat pahalılığı, fahiş kira artışları, temel gıda kuyrukları ve kentsel dönüşüm hareketlerinin basındaki yansıması.',
    years: '1970 — 2024',
    publications: ['Cumhuriyet', 'BirGün', 'Hürriyet', 'Milliyet'],
    docCount: 12,
    highlight: '1979 Yağ-Tüp Kuyrukları, 2013 Gezi Parkı, 2022 Barınma Krizi',
    tag: 'Yaşam & Toplum'
  }
];

export default function CollectionsView({ onSelectCollectionQuery }) {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">
              <Library size={22} style={{ color: 'var(--accent-petrol)' }} />
              Arşiv Koleksiyonları ve Dizinler
            </h2>
            <p className="card-desc">
              Arşiv Mercek bünyesinde sayısallaştırılmış basın arşivleri, belirli tarihsel ve tematik kapsamlara göre sınıflandırılmıştır.
              Araştırmaya başlamak istediğiniz koleksiyonu seçin.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {COLLECTIONS_DETAILED.map((col) => (
            <div
              key={col.id}
              style={{
                background: '#FAF9F5',
                border: '1px solid var(--border-line)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-petrol">{col.tag}</span>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {col.years}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {col.title}
                </h3>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {col.desc}
                </p>

                {/* Kapsanan Yayınlar */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kapsanan Yayınlar:</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {col.publications.map(p => (
                      <span key={p} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{p}</span>
                    ))}
                  </div>
                </div>

                {/* Önemli Dönüm Noktaları */}
                <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Önemli Dönemeçler: </strong>
                  {col.highlight}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-line)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>{col.docCount}</strong> taranmış nüsha
                </span>
                <button
                  type="button"
                  className="btn btn-outline-petrol"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={() => onSelectCollectionQuery && onSelectCollectionQuery(col.id === 'emek' ? 'grev' : col.title.split(' ')[0].toLowerCase())}
                >
                  <span>Koleksiyonu Araştır</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
