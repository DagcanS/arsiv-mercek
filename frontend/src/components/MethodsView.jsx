import React, { useState } from 'react';
import { BookOpen, Sigma, Activity, GitCompare, Binary, Wand2, ShieldCheck, CheckCircle2, Code2, AlertTriangle, Layers, Cpu } from 'lucide-react';
import { correctOcrText } from '../services/api';

export default function MethodsView({ engine }) {
  const [testOcrText, setTestOcrText] = useState('Met4l 1sç1ler1 sefalet zammlanna karşi fabr1kada qrev karari ald1');
  const [ocrResult, setOcrResult] = useState(null);
  const [testingOcr, setTestingOcr] = useState(false);

  const handleTestOcr = async () => {
    if (!testOcrText.trim()) return;
    setTestingOcr(true);
    try {
      const res = await correctOcrText(testOcrText);
      setOcrResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTestingOcr(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Başlık ve Arka Uç Durumu */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">
              <BookOpen size={22} style={{ color: 'var(--accent-petrol)' }} />
              Metodoloji ve Matematiksel Modeller
            </h2>
            <p className="card-desc">
              Arşiv Mercek platformunda uygulanan frekans normalizasyonu, söylem kutuplaşması ve anomali tespiti modelleri ile Python kod karşılıkları.
            </p>
          </div>
          {engine && (
            <div className="badge badge-petrol" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} />
              <span>Duygu: {engine.sentiment_backend} • Gömme: {engine.embedding_backend}</span>
            </div>
          )}
        </div>

        {/* 1. Göreli Frekans (PPM) */}
        <div className="method-formula-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="formula-title">
              <Sigma size={16} /> 1. Göreli Frekans Normalizasyonu (PPM)
            </div>
            <code style={{ fontSize: '0.74rem', background: '#ECE7DF', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-petrol)' }}>
              backend/app/nlp/statistics.py &rarr; relative_frequency_ppm()
            </code>
          </div>
          <div className="formula-math">
            PPM(w, t) = 10⁶ × [ f(w, t) / Nₜ ]
          </div>
          <p className="formula-explanation">
            Farklı dönemlerdeki toplam taranan kelime hacmi değişken olduğundan, ham frekans yerine sözcüğün o yıldaki toplam sözcük havuzuna ($N_t$) oranı hesaplanır ve milyon sözcük başına frekansa (Parts Per Million) çevrilir.
          </p>
        </div>

        {/* 2. Monroe Log-Odds (Dirichlet Prior) */}
        <div className="method-formula-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="formula-title">
              <GitCompare size={16} /> 2. İki Grup Arası Dirichlet Ön Dağılımlı Log-Odds (Monroe et al., 2008)
            </div>
            <code style={{ fontSize: '0.74rem', background: '#ECE7DF', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-petrol)' }}>
              backend/app/nlp/statistics.py &rarr; monroe_log_odds()
            </code>
          </div>
          <div className="formula-math">
            \hat&#123;\delta&#125;_w^(A - B) = \ln \left[ \frac&#123;y_&#123;wA&#125; + \alpha_w&#125;&#123;n_A + \alpha_0 - y_&#123;wA&#125; - \alpha_w&#125; \right] - \ln \left[ \frac&#123;y_&#123;wB&#125; + \alpha_w&#125;&#123;n_B + \alpha_0 - y_&#123;wB&#125; - \alpha_w&#125; \right]
          </div>
          <p className="formula-explanation">
            İki dönem veya iki basın bloğu arasındaki sözcük kullanım farklarını kıyaslarken seyrek kelimelerin küçük örneklemden ötürü uç değerler üretmesini engeller. Tüm külliyattan türetilen Dirichlet öncül dağılımı ($\alpha_w$) ile regülasyon sağlanır; $Z_w \ge 1.96$ eşiği %95 güven aralığında istatistiksel anlamlılığı gösterir.
          </p>
        </div>

        {/* 3. Sürekli Duygu & Rolling Z-Score */}
        <div className="method-formula-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="formula-title">
              <Activity size={16} /> 3. Zaman Serisi Kırılma ve Anomali Tespiti (Rolling Z-Score)
            </div>
            <code style={{ fontSize: '0.74rem', background: '#ECE7DF', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-petrol)' }}>
              backend/app/nlp/statistics.py &rarr; rolling_anomaly()
            </code>
          </div>
          <div className="formula-math">
            Z_t = \frac&#123;S_t - \mu_(t-k \dots t-1)&#125;&#123;\sigma_(t-k \dots t-1)&#125;
          </div>
          <p className="formula-explanation">
            Duygu veya terim sıklığındaki olağandışı kırılmaları yakalamak amacıyla geçmiş $k$ dönemi kapsayan kayan pencere ortalaması ($\mu$) ve varyansı ($\sigma$) kullanılır. Gelecek verisinden sızıntı (look-ahead bias) engellenmiştir.
          </p>
        </div>

        {/* 4. Esteban-Ray Kutuplaşma Endeksi */}
        <div className="method-formula-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="formula-title">
              <Binary size={16} /> 4. Esteban-Ray Kutuplaşma Endeksi (Econometrica, 1994)
            </div>
            <code style={{ fontSize: '0.74rem', background: '#ECE7DF', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-petrol)' }}>
              backend/app/nlp/statistics.py &rarr; esteban_ray()
            </code>
          </div>
          <div className="formula-math">
            P_&#123;ER&#125; = K \sum_i \sum_j \pi_i^(1 + \alpha) \pi_j |\mu_i - \mu_j|
          </div>
          <p className="formula-explanation">
            Farklı yayın bloklarının (muhalif, iktidar, merkez) söylemsel ağırlıkları ($\pi$) ve ortalama duygu konumları ($\mu$) arasındaki kutuplaşmayı grup içi özdeşleşme duyarlılığı ($\alpha = 1.3$) parametresiyle ölçer.
          </p>
        </div>

        {/* 5. Duygu Analiz Motoru Ayrımı */}
        <div className="method-formula-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="formula-title">
              <Layers size={16} /> 5. Duygu Analiz Motoru Mimarisi: Sözlük vs. BERTurk
            </div>
            <code style={{ fontSize: '0.74rem', background: '#ECE7DF', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-petrol)' }}>
              backend/app/nlp/sentiment.py & bert_backend.py
            </code>
          </div>
          <p className="formula-explanation" style={{ marginBottom: '8px' }}>
            <strong>Varsayılan Motor:</strong> Kural ve sözlük tabanlıdır. Türkçe haber diline özel 90+ terimlik ekonomi/kriz sözlüğü, pekiştirici katsayılar ve Türkçe olumsuzluk ekleri (<code>-madı/-medi</code>, <code>değil</code>, <code>önlendi</code>) ile <code>tanh()</code> sıkıştırmalı skor üretir.
          </p>
          <p className="formula-explanation">
            <strong>İsteğe Bağlı BERTurk:</strong> <code>MEDYATARIH_USE_BERT=1</code> ortam değişkeniyle HuggingFace <code>savasy/bert-base-turkish-sentiment-cased</code> modeli devreye alınabilir. Kapalıyken sözlük motoruna otomatik düşülür ve bu durum <code>/api/stats/engine</code> uç noktasında şeffafça bildirilir.
          </p>
        </div>
      </div>

      {/* 2. Veri Kökeni, Kalibrasyon ve Sınırlamalar */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">
              <ShieldCheck size={20} style={{ color: 'var(--accent-petrol)' }} />
              Veri Kökeni (Provenance) ve Metodolojik Sınırlamalar
            </h3>
            <p className="card-desc">
              Araştırma motorunun kullandığı verilerin kaynakları, doğrulanma durumu ve akademik sınırlar.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: '#FAF9F5', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--accent-petrol)', marginBottom: '8px' }}>
              Tarihsel Benchmark Külliyatı (1970–2024)
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              1970–2024 arası 43 kayıt, Türk basın tarihindeki kriz ve dönüm noktalarını (15-16 Haziran, 24 Ocak, 5 Nisan 1994, 2001 Krizi vb.) modellemek için derlenmiş <strong>sentetik kalibrasyon verisidir</strong>. Fiziksel gazete mikrofilmlerinden ya da arşiv tarayıcısından doğrulanmış OCR nüshaları içermez; algoritma ve görselleştirme testleri amacıyla sunulmaktadır.
            </p>
          </div>

          <div style={{ background: '#FAF9F5', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--accent-petrol)', marginBottom: '8px' }}>
              Canlı RSS Akış Verisi (2020–2026)
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Yakın dönem ve güncel haberler; Evrensel, BirGün, Cumhuriyet, Sol Haber, Bianet ve BloombergHT RSS akışlarından çekilen <strong>gerçek ve canlı haberlerdir</strong>. Her haberin orijinal web linki saklanır; kullanıcı doğrudan haberin kaynak sayfasına yönlendirilebilir.
            </p>
          </div>
        </div>

        <div style={{
          background: '#FFF8F0',
          border: '1px solid #F0D0B0',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--accent-kiremit)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: '#684520', lineHeight: 1.5 }}>
            <strong>Bilinen Sınırlamalar:</strong> Sözlük tabanlı duygu analizi bağlamsal kinaye (ironi) ve mecazları ıskalayabilir; BERTurk ise işlemci yükü ve bellek gereksinimi nedeniyle hafif sunucularda varsayılan olarak kapalıdır. Ayrıca tarihsel dönemlerdeki basına yönelik sansür ve baskı dönemleri (örn. 1971, 1980), gazete başlıklarında otosansür oluşturduğundan salt başlık analizi dönemin gerçek toplumsal duygu durumunu birebir yansıtmayabilir.
          </div>
        </div>
      </div>

      {/* 3. İnteraktif OCR Düzeltme Doğrulama Kutusu */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">
              <Wand2 size={18} style={{ color: 'var(--accent-petrol)' }} />
              İnteraktif OCR ve Tarihsel Sözlük Doğrulama
            </h3>
            <p className="card-desc">
              Tarihsel baskılarda bozulmuş sözcüklerin Levenshtein mesafesi ve Türkçe ek ayrıştırmasıyla nasıl onarıldığını test edin.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input
            type="text"
            className="input-text"
            value={testOcrText}
            onChange={(e) => setTestOcrText(e.target.value)}
            placeholder="Bozuk OCR metni girin..."
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTestOcr}
            disabled={testingOcr}
          >
            <span>{testingOcr ? 'Onarılıyor...' : 'Düzelt'}</span>
          </button>
        </div>

        {ocrResult && (
          <div style={{ background: '#FAF9F5', border: '1px solid var(--border-line)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Düzeltilmiş Metin:</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--accent-petrol)', marginBottom: '12px' }}>
              "{ocrResult.duzeltilmis_metin}"
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Değiştirilen Kelime Sayısı: <strong>{ocrResult.duzeltilen_kelime_sayisi}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
