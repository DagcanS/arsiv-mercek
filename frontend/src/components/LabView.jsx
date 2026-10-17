import React, { useState } from 'react';
import { Cpu, Upload, Globe, Play, CheckCircle, AlertTriangle, FileText, ArrowRight, Loader2, Sparkles, Wand2, ShieldCheck, RefreshCw } from 'lucide-react';
import { analyzeClassSentiment, correctOcrText, fetchHalkRss, uploadOcrFile } from '../services/api';

const PRESET_CLASS_TEXTS = [
  { label: 'Grev & Direniş Manşeti', text: 'Metal işçileri sefalet zammına karşı fabrikada grev kararı aldı, direniş büyüyor.' },
  { label: 'Öğrenci Barınma Eylemi', text: 'Üniversite öğrencileri barınma hakkı için meydanlarda omuz omuza yürüdü.' },
  { label: 'Sefalet Ücreti & Yoksulluk', text: 'Temel gıdaya gelen fahiş zamlar halkın alım gücünü eritti, yoksulluk derinleşiyor.' },
  { label: 'Sermaye Çerçevelemesi', text: 'Üretimdeki iş bırakma eylemleri tedarik zincirinde aksamalara ve zarara yol açtı.' }
];

const PRESET_OCR_NOISY = [
  { label: 'Grev & Metal İşçisi (1970)', text: 'Met4l 1sç1ler1 sefalet zammlanna karşi fabr1kada qrev karari ald1' },
  { label: 'Taşeron & Sendika Bülteni', text: 'Tasheron sisteme karş1 s3ndlka çatisi altmda d1ren1ş büyüyo' },
  { label: 'Toplu Sözleşme & Miting', text: 'Toplu s0zleşme masasında anlaşmazllk: İşçiler m0t1ng düzenledi' },
  { label: 'Enflasyon ve Pahalılık', text: 'Enflasyon ve hayat pahalligi halkin alim gücünü erltdi' }
];

export default function LabView({ onArticleAdded }) {
  const [activeLabTab, setActiveLabTab] = useState('sentiment'); // 'sentiment', 'ocr_corrector', 'halk_rss', 'ocr_upload'

  // 1. Sınıfsal Duygu State
  const [classText, setClassText] = useState(PRESET_CLASS_TEXTS[0].text);
  const [gamma, setGamma] = useState(0.85);
  const [analyzingClass, setAnalyzingClass] = useState(false);
  const [classResult, setClassResult] = useState(null);

  // 2. OCR Düzeltici State
  const [noisyOcrText, setNoisyOcrText] = useState(PRESET_OCR_NOISY[0].text);
  const [runningCorrection, setRunningCorrection] = useState(false);
  const [correctionResult, setCorrectionResult] = useState(null);

  // 3. Halk RSS State
  const [rssSourceType, setRssSourceType] = useState('emek');
  const [loadingRss, setLoadingRss] = useState(false);
  const [rssData, setRssData] = useState(null);

  // 4. Görsel OCR State
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [runningOcr, setRunningOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Sınıfsal Duygu Analizi Çağrısı
  const handleAnalyzeClass = async () => {
    if (!classText.trim()) return;
    setAnalyzingClass(true);
    try {
      const res = await analyzeClassSentiment(classText, gamma);
      setClassResult(res);
    } catch (err) {
      alert('Analiz hatası: ' + err.message);
    } finally {
      setAnalyzingClass(false);
    }
  };

  // OCR Düzeltme Çağrısı
  const handleCorrectOcr = async () => {
    if (!noisyOcrText.trim()) return;
    setRunningCorrection(true);
    try {
      const res = await correctOcrText(noisyOcrText);
      setCorrectionResult(res);
    } catch (err) {
      alert('Düzeltme hatası: ' + err.message);
    } finally {
      setRunningCorrection(false);
    }
  };

  // Halk RSS Akışını Çekme
  const handleFetchRss = async (type) => {
    setLoadingRss(true);
    try {
      const res = await fetchHalkRss(type);
      setRssData(res);
    } catch (err) {
      alert('RSS çekilemedi: ' + err.message);
    } finally {
      setLoadingRss(false);
    }
  };

  // Görsel OCR Yükleme
  const handleRunOcr = async () => {
    if (!ocrFile) return;
    setRunningOcr(true);
    try {
      const formData = new FormData();
      formData.append('file', ocrFile);
      formData.append('save_to_db', true);
      formData.append('newspaper_name', 'Tarihsel Emek Basını');
      const res = await uploadOcrFile(formData);
      setOcrResult(res);
      if (onArticleAdded) onArticleAdded();
    } catch (err) {
      alert('OCR hatası: ' + err.message);
    } finally {
      setRunningOcr(false);
    }
  };

  return (
    <div>
      {/* Üst Sekmeler */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="panel-header" style={{ marginBottom: '14px' }}>
          <div>
            <h2 className="panel-title">
              <Cpu size={22} color="var(--red-soviet)" />
              Sınıfsal NLP, Tarihsel OCR & Halk Basını Laboratuvarı
            </h2>
            <p className="panel-desc">
              Grev ve direnişleri kriminalize etmeyen duygu düzeltme motorunu test edin, yıpranmış işçi gazetesi OCR hatalarını Levenshtein ile onarın veya canlı halk basını akışını inceleyin.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            className={`btn-secondary ${activeLabTab === 'sentiment' ? 'active' : ''}`}
            onClick={() => setActiveLabTab('sentiment')}
            style={{
              borderColor: activeLabTab === 'sentiment' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              background: activeLabTab === 'sentiment' ? 'var(--red-bg)' : 'transparent',
              color: 'var(--white-pure)'
            }}
          >
            <Sparkles size={16} />
            <span>1. Sınıfsal Duygu Motoru (S_revize)</span>
          </button>

          <button
            className={`btn-secondary ${activeLabTab === 'ocr_corrector' ? 'active' : ''}`}
            onClick={() => setActiveLabTab('ocr_corrector')}
            style={{
              borderColor: activeLabTab === 'ocr_corrector' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              background: activeLabTab === 'ocr_corrector' ? 'var(--red-bg)' : 'transparent',
              color: 'var(--white-pure)'
            }}
          >
            <Wand2 size={16} />
            <span>2. Tarihsel OCR Düzeltici (Levenshtein)</span>
          </button>

          <button
            className={`btn-secondary ${activeLabTab === 'halk_rss' ? 'active' : ''}`}
            onClick={() => { setActiveLabTab('halk_rss'); if (!rssData) handleFetchRss('emek'); }}
            style={{
              borderColor: activeLabTab === 'halk_rss' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              background: activeLabTab === 'halk_rss' ? 'var(--red-bg)' : 'transparent',
              color: 'var(--white-pure)'
            }}
          >
            <Globe size={16} />
            <span>3. Emek & Halk Basını RSS Akışı</span>
          </button>

          <button
            className={`btn-secondary ${activeLabTab === 'ocr_upload' ? 'active' : ''}`}
            onClick={() => setActiveLabTab('ocr_upload')}
            style={{
              borderColor: activeLabTab === 'ocr_upload' ? 'var(--red-soviet)' : 'var(--border-subtle)',
              background: activeLabTab === 'ocr_upload' ? 'var(--red-bg)' : 'transparent',
              color: 'var(--white-pure)'
            }}
          >
            <Upload size={16} />
            <span>4. Gazete Küpürü Görsel Tarama</span>
          </button>
        </div>
      </div>

      {/* SEKME 1: SINIFSAL DUYGU MOTORU */}
      {activeLabTab === 'sentiment' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '12px' }}>
              Test Edilecek Haber Metni:
            </h3>

            {/* Hazır Metin Butonları */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {PRESET_CLASS_TEXTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setClassText(p.text)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: 'var(--white-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              className="input-field"
              rows="5"
              style={{ width: '100%', resize: 'vertical', marginBottom: '14px', lineHeight: 1.6 }}
              value={classText}
              onChange={(e) => setClassText(e.target.value)}
              placeholder="İşçi eylemi, grev veya ekonomi manşetini girin..."
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--white-muted)' }}>Direnç Katsayısı (γ):</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  className="input-field"
                  style={{ width: '80px', padding: '6px 10px' }}
                  value={gamma}
                  onChange={(e) => setGamma(Number(e.target.value))}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleAnalyzeClass}
                disabled={analyzingClass}
              >
                {analyzingClass ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                <span>Sınıfsal Analizi Başlat</span>
              </button>
            </div>
          </div>

          {/* Sağ: Sınıfsal Analiz Çıktısı */}
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
              Çift Eksenli Sınıfsal Duygu Çıktısı:
            </h3>

            {!classResult ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--white-muted)' }}>
                Metni seçip "Sınıfsal Analizi Başlat" butonuna tıklayın. Model standart yapay zekanın negatif gördüğü grev kelimelerini düzeltip direniş puanını hesaplayacaktır.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Karşılaştırma Kutusu: Ham Skor vs Düzeltilmiş Skor */}
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(250, 204, 21, 0.12))', 
                  border: '1.5px solid var(--border-red)', 
                  borderRadius: '10px', 
                  padding: '16px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--white-dim)', textTransform: 'uppercase' }}>Ham Model / Sözlük Çıktısı (S_ham):</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--red-soviet-light)', fontFamily: 'var(--font-mono)' }}>
                        {classResult.ham_bert_skoru} (Kriz/Negatif Damgası)
                      </div>
                    </div>
                    <ArrowRight size={22} color="var(--yellow-soviet)" />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--yellow-soviet)', textTransform: 'uppercase', fontWeight: 700 }}>Düzeltilmiş Halk Odaklı Duygu:</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--yellow-soviet)', fontFamily: 'var(--font-mono)' }}>
                        {classResult.halk_odakli_duygu > 0 ? `+${classResult.halk_odakli_duygu}` : classResult.halk_odakli_duygu}
                      </div>
                    </div>
                  </div>

                  {classResult.bias_duzeltildi && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--yellow-soviet)', marginTop: '8px' }}>
                      <ShieldCheck size={16} />
                      <span><strong>Algoritmik Önyargı İptal Edildi:</strong> Haber konusu bir hak mücadelesi olduğu için negatif ceza kaldırıldı ve politik özneleşme dinamizmi eklendi.</span>
                    </div>
                  )}
                </div>

                {/* Çift Eksen Skorları */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-red)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--white-muted)', textTransform: 'uppercase' }}>1. Yapısal Kriz / Sömürü:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--red-soviet-light)' }}>
                      %{Math.round(classResult.yapisal_kriz_yuku * 100)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--white-dim)', marginTop: '2px' }}>
                      Kriz Terimleri: {classResult.kriz_terimleri?.join(', ') || 'Yok'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(250, 204, 21, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-yellow)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--white-muted)', textTransform: 'uppercase' }}>2. Direniş & Mücadele:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--yellow-soviet)' }}>
                      %{Math.round(classResult.direnis_dinamizmi * 100)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--white-dim)', marginTop: '2px' }}>
                      Eylem Terimleri: {classResult.direnis_terimleri?.join(', ') || 'Yok'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEKME 2: TARİHSEL OCR DÜZELTİCİ (LEVENSHTEIN + EMEK SÖZLÜĞÜ) */}
      {activeLabTab === 'ocr_corrector' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '12px' }}>
              <Wand2 size={18} color="var(--yellow-soviet)" />
              Bozuk Tarihsel Gazete Metni (Gürültülü Kanal):
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {PRESET_OCR_NOISY.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setNoisyOcrText(p.text)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: 'var(--white-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              className="input-field"
              rows="5"
              style={{ width: '100%', resize: 'vertical', marginBottom: '14px', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}
              value={noisyOcrText}
              onChange={(e) => setNoisyOcrText(e.target.value)}
              placeholder="Arşiv taramasından çıkan bozuk OCR metnini girin..."
            />

            <button
              className="btn-primary"
              onClick={handleCorrectOcr}
              disabled={runningCorrection}
            >
              {runningCorrection ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>Levenshtein ile Tarihsel Metni Onar</span>
            </button>
          </div>

          {/* Düzeltme Raporu */}
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
              Onarılan Metin ve Değişiklik Haritası:
            </h3>

            {!correctionResult ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--white-muted)' }}>
                Bozuk OCR metnini girip onar butonuna tıklayın. Model "qrev" &rarr; "grev", "sendlka" &rarr; "sendika", "1sç1ler1" &rarr; "işçileri" dönüşümlerini yapacaktır.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(10, 14, 22, 0.85)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-yellow)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--yellow-soviet)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>
                    Onarılmış Temiz Metin:
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--white-pure)', lineHeight: 1.5 }}>
                    {correctionResult.duzeltilmis_metin}
                  </p>
                </div>

                {/* Yapılan Düzeltmeler Tablosu */}
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--white-muted)', marginBottom: '8px' }}>
                    Tespit Edilen ve Düzeltilen {correctionResult.duzeltilen_kelime_sayisi} Terim:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {correctionResult.degisiklikler?.map((d, i) => (
                      <span key={i} style={{ 
                        background: 'rgba(250, 204, 21, 0.1)', 
                        border: '1px solid var(--border-yellow)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <span style={{ color: 'var(--red-soviet-light)', textDecoration: 'line-through' }}>{d.orijinal}</span>
                        {' -> '}
                        <strong style={{ color: 'var(--yellow-soviet)' }}>{d.duzeltilmis}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Düzeltilmiş Metnin Sınıfsal Analizi */}
                {correctionResult.sinifsal_analiz && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--white-muted)' }}>Düzeltilmiş Metnin Sınıfsal Duygu Skoru:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--yellow-soviet)', marginTop: '2px' }}>
                      Direniş Dinamizmi: %{Math.round(correctionResult.sinifsal_analiz.direnis_dinamizmi * 100)} • Halk Odaklı Duygu: +{correctionResult.sinifsal_analiz.halk_odakli_duygu}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEKME 3: EMEK VE HALK BASINI RSS AKIŞI */}
      {activeLabTab === 'halk_rss' && (
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title" style={{ fontSize: '1.1rem' }}>
                <Globe size={20} color="var(--red-soviet)" />
                Emek ve Bağımsız Basın Canlı Akışı (Evrensel, BirGün, Bianet, Sendika.org)
              </h3>
              <p className="panel-desc">
                Emek odaklı kaynakların haber başlıklarını doğrudan çekip sınıfsal çerçeveleme motoruyla etiketleyin.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn-secondary ${rssSourceType === 'emek' ? 'active' : ''}`}
                onClick={() => { setRssSourceType('emek'); handleFetchRss('emek'); }}
                style={{ background: rssSourceType === 'emek' ? 'var(--red-bg)' : 'transparent', borderColor: rssSourceType === 'emek' ? 'var(--red-soviet)' : 'var(--border-subtle)' }}
              >
                Emek Basını Akışı
              </button>
              <button
                className={`btn-secondary ${rssSourceType === 'sermaye' ? 'active' : ''}`}
                onClick={() => { setRssSourceType('sermaye'); handleFetchRss('sermaye'); }}
                style={{ background: rssSourceType === 'sermaye' ? 'var(--red-bg)' : 'transparent', borderColor: rssSourceType === 'sermaye' ? 'var(--red-soviet)' : 'var(--border-subtle)' }}
              >
                Sermaye Medyası (Karşılaştırma)
              </button>
            </div>
          </div>

          {loadingRss ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--yellow-soviet)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <div>RSS akışları taranıyor ve sınıfsal duygu analizi uygulanıyor...</div>
            </div>
          ) : !rssData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--white-muted)' }}>
              Akışı yüklemek için bir kaynak türü seçin.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
              {rssData.haberler?.map((art, idx) => (
                <div key={idx} className="newspaper-headline-card">
                  <div>
                    <div className="newspaper-masthead">
                      <span className="newspaper-name" style={{ color: 'var(--yellow-soviet)' }}>{art.gazete}</span>
                      <span className="newspaper-date">{art.tarih}</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--white-pure)', marginBottom: '8px', lineHeight: 1.35 }}>
                      {art.baslik}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--white-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                      {art.ozet || art.tam_metin}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      <span className={`badge ${art.halk_odakli_duygu > 0 ? 'badge-pos' : 'badge-neg'}`}>
                        Duygu: {art.halk_odakli_duygu > 0 ? `+${art.halk_odakli_duygu}` : art.halk_odakli_duygu}
                      </span>
                      {art.direnis_dinamizmi > 0 && (
                        <span className="badge badge-direnis">
                          Direniş: %{Math.round(art.direnis_dinamizmi * 100)}
                        </span>
                      )}
                      {art.yapisal_kriz_yuku > 0 && (
                        <span className="badge badge-crisis">
                          Sömürü: %{Math.round(art.yapisal_kriz_yuku * 100)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEKME 4: GAZETE KÜPÜRÜ GÖRSEL TARAMA */}
      {activeLabTab === 'ocr_upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '12px' }}>
              Taranmış Gazete Sayfası Yükle:
            </h3>

            <div style={{ 
              border: '2px dashed var(--border-subtle)', 
              borderRadius: '10px', 
              padding: '30px', 
              textAlign: 'center',
              marginBottom: '16px',
              background: 'rgba(8, 11, 18, 0.6)'
            }}>
              <Upload size={36} style={{ color: 'var(--red-soviet-light)', opacity: 0.8, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--white-pure)', marginBottom: '4px' }}>Gazete kupürü veya fotoğrafı seçin</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--white-dim)', marginBottom: '14px' }}>JPEG, PNG desteklenir. Otomatik Levenshtein onarımı ve sınıfsal duygu uygulanır.</p>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setOcrFile(f); setOcrPreview(URL.createObjectURL(f)); setOcrResult(null); } }} style={{ display: 'none' }} id="ocr-lab-upload" />
              <label htmlFor="ocr-lab-upload" className="btn-secondary" style={{ cursor: 'pointer' }}>
                Dosya Seç
              </label>
            </div>

            {ocrPreview && (
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <img src={ocrPreview} alt="Önizleme" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleRunOcr}
              disabled={!ocrFile || runningOcr}
            >
              {runningOcr ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>OCR ve Sınıfsal Analizi Başlat</span>
            </button>
          </div>

          <div className="glass-panel">
            <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '14px' }}>
              Tarama ve Düzeltme Raporu:
            </h3>

            {!ocrResult ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--white-muted)' }}>
                Gazete kupürü yükleyip analiz edin. Çıkarılan metin otomatik olarak TarihselOcrDuzeltici motorundan geçirilecektir.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(8, 11, 18, 0.85)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-yellow)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--yellow-soviet)', textTransform: 'uppercase', marginBottom: '4px' }}>Onarılmış Manşet:</div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--white-pure)', fontSize: '1.15rem' }}>
                    {ocrResult.headline}
                  </h4>
                </div>

                <div style={{ background: 'rgba(8, 11, 18, 0.85)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--white-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Metin Gövdesi:</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--white-muted)', lineHeight: 1.6 }}>
                    {ocrResult.body}
                  </p>
                </div>

                {ocrResult.saved_to_db && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--yellow-soviet)', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} />
                    <span>Başarıyla halk basını veritabanına ve zaman serisine kaydedildi!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
