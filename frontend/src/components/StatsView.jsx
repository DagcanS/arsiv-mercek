import React, { useEffect, useMemo, useState } from 'react';
import {
  Sigma, BarChart3, Binary, Activity, GitCompare, Timer, Plus, X, Loader2, AlertTriangle, Info, Database
} from 'lucide-react';
import LineChart from './charts/LineChart';
import DivergingBars from './charts/DivergingBars';
import {
  fetchFrequency, fetchTfidf, fetchLogOdds, fetchSentimentSeries, fetchPolarizationSeries
} from '../services/api';

const PALETTE = ['#dc2626', '#facc15', '#ffffff', '#f97316', '#fca5a5', '#fde047', '#9ca3af', '#b91c1c'];
const DEFAULT_TERMS = ['enflasyon', 'dolar', 'faiz', 'kriz', 'zam', 'imf'];
const BLOCKS = {
  muhalif_bagimsiz: 'Muhalif & Bağımsız',
  iktidar_yanlisi: 'İktidar Yanlısı & Sağ',
  merkez: 'Merkez / Ana Akım',
  ekonomi: 'Ekonomi Basını',
};

const SECTIONS = [
  { id: 'freq', label: 'Göreli Frekans', icon: BarChart3 },
  { id: 'tfidf', label: 'TF-IDF', icon: Binary },
  { id: 'logodds', label: 'Log-Odds', icon: GitCompare },
  { id: 'sentiment', label: 'Duygu · EMA · CUSUM', icon: Activity },
  { id: 'polar', label: 'Kutuplaşma', icon: Sigma },
  { id: 'xcorr', label: 'Çapraz Korelasyon', icon: Timer },
];

function FormulaCard({ title, lines, children }) {
  return (
    <div className="formula-card fade-up">
      <div className="formula-title"><Sigma size={14} /> {title}</div>
      <div className="formula-body">
        {lines.map((l, i) => <div key={i} className="formula-line">{l}</div>)}
      </div>
      {children && <div className="formula-note">{children}</div>}
    </div>
  );
}

function Spinner() {
  return <div className="stat-loading"><Loader2 size={22} className="animate-spin" /> Hesaplanıyor...</div>;
}

function Notice({ children, tone = 'info' }) {
  const Icon = tone === 'warn' ? AlertTriangle : Info;
  return <div className={`stat-notice stat-notice-${tone}`}><Icon size={16} /><span>{children}</span></div>;
}

/* ===================== 1. GÖRELİ FREKANS ===================== */
function FrequencySection() {
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [input, setInput] = useState('');
  const [threshold, setThreshold] = useState(1.96);
  const [windowK, setWindowK] = useState(5);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!terms.length) { setData(null); return; }
    setLoading(true);
    fetchFrequency(terms, windowK, threshold).then((d) => { setData(d); setLoading(false); });
  }, [terms, threshold, windowK]);

  const addTerm = () => {
    const t = input.trim().toLowerCase();
    if (t && !terms.includes(t) && terms.length < 8) setTerms([...terms, t]);
    setInput('');
  };

  const series = data ? Object.entries(data.series).map(([term, vals], i) => ({
    key: term, label: term, color: PALETTE[i % PALETTE.length], values: vals.map((v) => v.ppm),
  })) : [];

  const pins = data ? Object.entries(data.series).flatMap(([term, vals], i) =>
    vals.filter((v) => v.anomaly).map((v) => ({ x: v.year, color: PALETTE[i % PALETTE.length], label: term }))
  ) : [];

  return (
    <div className="stat-grid">
      <div className="glass-panel stat-main">
        <div className="stat-controls">
          <div className="chip-row">
            {terms.map((t, i) => (
              <span key={t} className="term-chip" style={{ borderColor: PALETTE[i % PALETTE.length] }}>
                <span className="chart-swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                {t}
                <button onClick={() => setTerms(terms.filter((x) => x !== t))} aria-label={`${t} kaldır`}><X size={12} /></button>
              </span>
            ))}
            <div className="chip-input">
              <input className="input-field" placeholder="terim ekle" value={input}
                onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTerm()} />
              <button className="btn-secondary" onClick={addTerm}><Plus size={14} /></button>
            </div>
          </div>
          <div className="control-row">
            <label>Pencere k
              <input type="number" min="2" max="15" className="input-field input-sm" value={windowK} onChange={(e) => setWindowK(Number(e.target.value))} />
            </label>
            <label>Z eşiği
              <select className="input-field input-sm" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
                <option value={1.96}>1.96 (%95)</option>
                <option value={2.58}>2.58 (%99)</option>
              </select>
            </label>
          </div>
        </div>
        {loading ? <Spinner /> : (
          <LineChart xs={data?.years || []} series={series} pins={pins} yFormat={(v) => `${Math.round(v)}`} />
        )}
        {data && (
          <div className="stat-table">
            <div className="stat-table-head"><span>Terim</span><span>Toplam geçiş</span><span>Anomali yılları (|Z| ≥ {threshold})</span></div>
            {Object.entries(data.series).map(([term, vals], i) => (
              <div className="stat-table-row" key={term}>
                <span style={{ color: PALETTE[i % PALETTE.length] }}>{term}</span>
                <span className="mono">{data.totals[term]}</span>
                <span className="mono">{vals.filter((v) => v.anomaly).map((v) => `${v.year} (Z=${v.rolling_z})`).join(', ') || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="stat-side">
        <FormulaCard title="Göreli Frekans (PPM)" lines={['RF(w,t) = f(w,t) / Σᵢ f(i,t) × 10⁶']}>
          Yıllara göre değişen arşiv hacmini normalize eder. Kök eşleşmesi kullanılır: "enflasyon" terimi "enflasyonun", "enflasyonla" biçimlerini de sayar.
        </FormulaCard>
        <FormulaCard title="Rolling Z-Score" lines={['Z(t) = (x(t) − μ(t,k)) / σ(t,k)']}>
          μ ve σ yalnızca önceki k gözlemden hesaplanır (geleceğe bakmaz). Eşiği aşan yıllar grafikte pin ile işaretlenir.
        </FormulaCard>
      </div>
    </div>
  );
}

/* ===================== 2. TF-IDF ===================== */
function TfidfSection() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(null);

  useEffect(() => {
    fetchTfidf(12).then((d) => {
      setData(d);
      if (d.years?.length) setYear(d.years.includes(2001) ? 2001 : d.years[0]);
    });
  }, []);

  if (!data) return <Spinner />;
  const terms = (year && data.by_year[year]) || [];
  const max = Math.max(...terms.map((t) => t.tfidf), 1e-9);

  return (
    <div className="stat-grid">
      <div className="glass-panel stat-main">
        <div className="chip-row" style={{ marginBottom: 18 }}>
          {data.years.map((y) => (
            <button key={y} className={`year-chip ${y === year ? 'active' : ''}`} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
        <h3 className="stat-subtitle">{year} yılına özgü terimler</h3>
        <div className="tfidf-list">
          {terms.map((t, i) => (
            <div className="tfidf-row fade-up" key={t.term} style={{ animationDelay: `${i * 35}ms` }}>
              <span className="tfidf-term">{t.term}</span>
              <div className="tfidf-track"><div className="tfidf-bar" style={{ width: `${(t.tfidf / max) * 100}%` }} /></div>
              <span className="mono tfidf-val">{t.tfidf.toFixed(4)}</span>
              <span className="mono tfidf-count">{t.count}x</span>
            </div>
          ))}
          {!terms.length && <div className="chart-empty">Bu yıl için terim yok.</div>}
        </div>
      </div>
      <div className="stat-side">
        <FormulaCard title="TF-IDF (yıl = belge)" lines={['TF-IDF(w,d) = TF(w,d) × log( N / (1 + df(w)) )']}>
          Her yılın tüm haberleri tek belge sayılır. Bütün yıllarda geçen genel kelimeler sıfıra yaklaşır; o döneme özgü aktörler ve kavramlar (ör. 2001'de "tmsf", "derviş") öne çıkar.
        </FormulaCard>
      </div>
    </div>
  );
}

/* ===================== 3. LOG-ODDS ===================== */
function LogOddsSection() {
  const [mode, setMode] = useState('block');
  const [a, setA] = useState('muhalif_bagimsiz');
  const [b, setB] = useState('iktidar_yanlisi');
  const [pa, setPa] = useState('1994-2005');
  const [pb, setPb] = useState('2018-2024');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    const params = mode === 'block' ? { mode, a, b } : { mode, a: pa, b: pb };
    fetchLogOdds({ ...params, topN: 12 }).then((d) => { setData(d); setLoading(false); });
  };

  useEffect(run, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="stat-grid">
      <div className="glass-panel stat-main">
        <div className="control-row" style={{ marginBottom: 18 }}>
          <label>Karşılaştırma
            <select className="input-field input-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="block">Basın blokları</option>
              <option value="period">Dönemler</option>
            </select>
          </label>
          {mode === 'block' ? (
            <>
              <label>Grup A
                <select className="input-field input-sm" value={a} onChange={(e) => setA(e.target.value)}>
                  {Object.entries(BLOCKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>Grup B
                <select className="input-field input-sm" value={b} onChange={(e) => setB(e.target.value)}>
                  {Object.entries(BLOCKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </>
          ) : (
            <>
              <label>Dönem A<input className="input-field input-sm" value={pa} onChange={(e) => setPa(e.target.value)} /></label>
              <label>Dönem B<input className="input-field input-sm" value={pb} onChange={(e) => setPb(e.target.value)} /></label>
            </>
          )}
          <button className="btn-primary" onClick={run} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />} Hesapla
          </button>
        </div>

        {loading || !data ? <Spinner /> : (
          <>
            <div className="stat-kpis">
              <div><span>Belge A</span><strong>{data.docs_a}</strong></div>
              <div><span>Belge B</span><strong>{data.docs_b}</strong></div>
              <div><span>Sözcük dağarcığı</span><strong>{data.vocab_size}</strong></div>
              <div><span>Anlamlı terim (|Z|≥1.96)</span><strong>{data.significant_count}</strong></div>
            </div>
            {data.significant_count === 0 && (
              <Notice tone="warn">
                Mevcut örneklemde hiçbir terim %95 anlamlılık eşiğini geçmiyor. Sıralama yönelim gösterir ama istatistiksel kanıt değildir; daha fazla haber kazıyarak örneklemi büyütün.
              </Notice>
            )}
            <DivergingBars leftItems={data.b_terms} rightItems={data.a_terms} leftLabel={`${data.label_b} (Z < 0)`} rightLabel={`${data.label_a} (Z > 0)`} />
          </>
        )}
      </div>
      <div className="stat-side">
        <FormulaCard
          title="Monroe Log-Odds (Dirichlet prior)"
          lines={[
            'δ(w) = log[(yᵢ+α_w)/(nᵢ+α₀−yᵢ−α_w)]',
            '      − log[(yⱼ+α_w)/(nⱼ+α₀−yⱼ−α_w)]',
            'σ²(δ) ≈ 1/(yᵢ+α_w) + 1/(yⱼ+α_w)',
            'Z(w) = δ(w) / √σ²(δ)',
          ]}
        >
          α_w önseli tüm arşivin kelime frekansıdır; nadir kelimelerin abartılı fark üretmesini engeller. Pozitif Z Grup A'ya, negatif Z Grup B'ye özgü kavramları verir.
        </FormulaCard>
      </div>
    </div>
  );
}

/* ===================== 4. DUYGU · EMA · CUSUM ===================== */
function SentimentSection() {
  const [lens, setLens] = useState('ham');
  const [span, setSpan] = useState(3);
  const [h, setH] = useState(3);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSentimentSeries({ lens, span, h, z_threshold: 1.96 }).then((d) => { setData(d); setLoading(false); });
  }, [lens, span, h]);

  const pins = data ? [
    ...data.anomalies.map((a) => ({ x: a.year, color: '#dc2626', label: `Z=${a.z}` })),
    ...data.cusum.changepoints.map((c) => ({ x: c.year, color: '#facc15', label: c.direction === 'yukari' ? 'CUSUM ↑' : 'CUSUM ↓' })),
  ] : [];

  return (
    <div className="stat-grid">
      <div className="glass-panel stat-main">
        <div className="control-row" style={{ marginBottom: 14 }}>
          <div className="seg-toggle">
            <button className={lens === 'ham' ? 'active' : ''} onClick={() => setLens('ham')}>Ham duygu</button>
            <button className={lens === 'halk' ? 'active' : ''} onClick={() => setLens('halk')}>Halk odaklı mercek</button>
          </div>
          <label>EMA penceresi k
            <input type="number" min="2" max="12" className="input-field input-sm" value={span} onChange={(e) => setSpan(Number(e.target.value))} />
          </label>
          <label>CUSUM h
            <input type="number" min="1" max="8" step="0.5" className="input-field input-sm" value={h} onChange={(e) => setH(Number(e.target.value))} />
          </label>
        </div>
        {loading || !data ? <Spinner /> : (
          <>
            <LineChart
              xs={data.years}
              yDomain={[-1, 1]}
              refLines={[{ y: 0, label: 'nötr', color: '#9ca3af' }]}
              pins={pins}
              series={[
                { key: 'mean', label: 'Yıllık ortalama S̄(t)', color: lens === 'halk' ? '#facc15' : '#dc2626', values: data.mean, area: true },
                { key: 'ema', label: `EMA (α = ${data.params.alpha})`, color: '#ffffff', values: data.ema, dashed: true, width: 2 },
              ]}
            />
            <h3 className="stat-subtitle" style={{ marginTop: 22 }}>CUSUM kontrol grafiği (standardize)</h3>
            <LineChart
              xs={data.years}
              height={190}
              refLines={[{ y: data.params.h, label: `h = ${data.params.h}`, color: '#facc15' }]}
              series={[
                { key: 'pos', label: 'S⁺ (yukarı kayma)', color: '#facc15', values: data.cusum.s_pos },
                { key: 'neg', label: 'S⁻ (aşağı kayma)', color: '#dc2626', values: data.cusum.s_neg },
              ]}
            />
            <div className="stat-kpis">
              <div><span>Anomali yılları</span><strong>{data.anomalies.map((a) => a.year).join(', ') || '—'}</strong></div>
              <div><span>Rejim kırılmaları</span><strong>{data.cusum.changepoints.map((c) => c.year).join(', ') || '—'}</strong></div>
              <div><span>μ₀ / σ</span><strong>{data.cusum.mu0} / {data.cusum.sigma}</strong></div>
            </div>
          </>
        )}
      </div>
      <div className="stat-side">
        <FormulaCard title="Sürekli Duygu Skoru" lines={['S(i) = P(Pozitif | xᵢ) − P(Negatif | xᵢ)']}>
          Varsayılan arka uç sözlük tabanlıdır; BERTurk açıldığında Softmax olasılıkları kullanılır.
        </FormulaCard>
        <FormulaCard title="Halk Odaklı Düzeltme (ek mercek)" lines={['S_rev = S + γ·(D + |S|)   eğer D > 0 ve S < 0']}>
          D: grev, eylem, boykot gibi hak arayışı terimlerinin yoğunluğu. Haberin kendisi değişmez; yalnızca modelin bu terimlere verdiği otomatik negatif ceza nötrlenir.
        </FormulaCard>
        <FormulaCard title="EMA" lines={['EMA(t) = α·S̄(t) + (1−α)·EMA(t−1)', 'α = 2 / (k + 1)']} />
        <FormulaCard title="CUSUM (iki yönlü)" lines={['S⁺(t) = max(0, S⁺(t−1) + z(t) − k)', 'S⁻(t) = max(0, S⁻(t−1) − z(t) − k)']}>
          S⁺ veya S⁻ h eşiğini aştığında söylemde kalıcı rejim değişikliği işaretlenir.
        </FormulaCard>
      </div>
    </div>
  );
}

/* ===================== 5. KUTUPLAŞMA ===================== */
function PolarizationSection() {
  const [a, setA] = useState('muhalif_bagimsiz');
  const [b, setB] = useState('iktidar_yanlisi');
  const [alpha, setAlpha] = useState(1.3);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPolarizationSeries(a, b, alpha).then((d) => { setData(d); setLoading(false); });
  }, [a, b, alpha]);

  const xs = data?.series.map((r) => r.year) || [];

  return (
    <div className="stat-grid">
      <div className="glass-panel stat-main">
        <div className="control-row" style={{ marginBottom: 14 }}>
          <label>Blok A
            <select className="input-field input-sm" value={a} onChange={(e) => setA(e.target.value)}>
              {Object.entries(BLOCKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Blok B
            <select className="input-field input-sm" value={b} onChange={(e) => setB(e.target.value)}>
              {Object.entries(BLOCKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Esteban-Ray α
            <input type="number" min="0.1" max="1.6" step="0.1" className="input-field input-sm" value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
          </label>
        </div>
        {loading || !data ? <Spinner /> : (
          <>
            <div className="stat-kpis">
              <div><span>Esteban-Ray (tüm arşiv)</span><strong>{data.overall.esteban_ray ?? '—'}</strong></div>
              <div><span>JSD (A ↔ B)</span><strong>{data.overall.jsd ?? '—'}</strong></div>
              <div><span>Kosinüs uzaklığı</span><strong>{data.overall.cosine ?? '—'}</strong></div>
              <div><span>Belge A / B</span><strong>{data.overall.n_a} / {data.overall.n_b}</strong></div>
            </div>
            <LineChart
              xs={xs}
              yDomain={[0, 1]}
              series={[
                { key: 'er', label: 'Esteban-Ray (yıl içi duygu)', color: '#dc2626', values: data.series.map((r) => r.esteban_ray) },
                { key: 'jsd', label: 'Jensen-Shannon (A ↔ B)', color: '#facc15', values: data.series.map((r) => r.jsd) },
                { key: 'cos', label: 'Kosinüs uzaklığı (A ↔ B)', color: '#ffffff', values: data.series.map((r) => r.cosine) },
              ]}
            />
            <Notice>
              JSD ve kosinüs yalnızca iki bloğun da aynı yıl haberi olduğunda hesaplanır; boşluklar veri eksikliğidir. Gömme arka ucu: <strong>{data.embedding_backend}</strong>.
            </Notice>
          </>
        )}
      </div>
      <div className="stat-side">
        <FormulaCard title="Esteban-Ray" lines={['P(π,s) = K · Σᵢ Σⱼ πᵢ^(1+α) · πⱼ · |sᵢ − sⱼ|']}>
          Duygu ekseni 5 kümeye bölünür. K, tüm kütlenin iki uca eşit dağıldığı durumda indeks 1 olacak şekilde seçilmiştir.
        </FormulaCard>
        <FormulaCard title="Jensen-Shannon Iraksaması" lines={['JSD(P‖Q) = ½·KL(P‖M) + ½·KL(Q‖M)', 'M = ½(P + Q),  log₂ → [0, 1]']} />
        <FormulaCard title="Kosinüs Söylem Uzaklığı" lines={['1 − (μ_A · μ_B) / (‖μ_A‖ ‖μ_B‖)']}>
          μ: bloğun ortalama metin vektörü. BERTurk kapalıyken TF-IDF vektörleri kullanılır.
        </FormulaCard>
      </div>
    </div>
  );
}

/* ===================== 6. ÇAPRAZ KORELASYON ===================== */
function CrossCorrelationSection({ dualAxisData }) {
  const xc = dualAxisData?.cross_correlation;
  const timeline = dualAxisData?.timeline || [];
  if (!xc) return <Spinner />;

  const maxAbs = Math.max(0.2, ...xc.lags.filter((l) => l.r !== null).map((l) => Math.abs(l.r)));
  const best = xc.best;

  return (
    <div className="stat-grid">
      <div className="glass-panel stat-main">
        <h3 className="stat-subtitle">Yapısal kriz yükü ve toplumsal hareket dinamizmi (yıllık)</h3>
        <LineChart
          xs={timeline.map((t) => t.year)}
          yDomain={[0, 1]}
          series={[
            { key: 'k', label: 'Yapısal kriz yükü', color: '#dc2626', values: timeline.map((t) => t.yapisal_kriz_yuku) },
            { key: 'd', label: 'Toplumsal hareket dinamizmi', color: '#facc15', values: timeline.map((t) => t.direnis_dinamizmi) },
          ]}
        />
        <h3 className="stat-subtitle" style={{ marginTop: 22 }}>Gecikmeye göre korelasyon r(ℓ)</h3>
        <div className="lag-chart">
          {xc.lags.map((l) => {
            const h = l.r === null ? 0 : (Math.abs(l.r) / maxAbs) * 100;
            const isBest = best && best.lag === l.lag;
            return (
              <div key={l.lag} className={`lag-col ${isBest ? 'best' : ''}`} title={`ℓ=${l.lag}, r=${l.r ?? '—'}, p=${l.p ?? '—'}, n=${l.n}`}>
                <div className="lag-half lag-top">
                  {l.r !== null && l.r > 0 && <div className="lag-bar pos" style={{ height: `${h}%` }} />}
                </div>
                <div className="lag-half lag-bottom">
                  {l.r !== null && l.r < 0 && <div className="lag-bar neg" style={{ height: `${h}%` }} />}
                </div>
                <div className="lag-label mono">{l.lag > 0 ? `+${l.lag}` : l.lag}</div>
                <div className="lag-n mono">n={l.n}</div>
              </div>
            );
          })}
        </div>
        {best ? (
          <Notice tone={xc.significant ? 'info' : 'warn'}>
            En güçlü ilişki ℓ = {best.lag} yılda: r = {best.r}, p = {best.p}, n = {best.n}.{' '}
            {xc.significant
              ? (best.lag > 0 ? 'Kriz yükündeki artışı, belirtilen gecikmeyle toplumsal hareket haberlerindeki değişim izliyor (p < 0.05).' : 'İlişki anlamlı; yön ve gecikme yorumlanırken nedensellik iddia edilmemelidir.')
              : 'Bu ilişki istatistiksel olarak anlamlı değil (p ≥ 0.05). Mevcut örneklemle "kriz sonrası direniş yükselir" gibi bir sonuç çıkarılamaz.'}
          </Notice>
        ) : (
          <Notice tone="warn">Hiçbir gecikmede en az {xc.min_pairs} yıllık eşleşme yok; korelasyon hesaplanamadı.</Notice>
        )}
      </div>
      <div className="stat-side">
        <FormulaCard title="Gecikmeli Çapraz Korelasyon" lines={['r(ℓ) = corr( K(t), D(t + ℓ) )', 't = r·√((n−2)/(1−r²))  →  p-değeri']}>
          ℓ &gt; 0: kriz yükü (K) toplumsal hareket dinamizminden (D) önce gelir. Seriler yıllık ızgarada eşlenir; eksik yıllar atlanır ve her gecikme için eşleşme sayısı (n) gösterilir.
        </FormulaCard>
      </div>
    </div>
  );
}

/* ===================== ANA BİLEŞEN ===================== */
export default function StatsView({ engine, dualAxisData }) {
  const [section, setSection] = useState('freq');

  const SectionBody = useMemo(() => ({
    freq: <FrequencySection />,
    tfidf: <TfidfSection />,
    logodds: <LogOddsSection />,
    sentiment: <SentimentSection />,
    polar: <PolarizationSection />,
    xcorr: <CrossCorrelationSection dualAxisData={dualAxisData} />,
  }), [dualAxisData]);

  return (
    <div>
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div className="panel-header" style={{ marginBottom: 14 }}>
          <div>
            <h2 className="panel-title"><Sigma size={22} color="var(--red-soviet)" /> İstatistik Motoru</h2>
            <p className="panel-desc">Tüm metrikler veritabanındaki haberlerden canlı hesaplanır. Parametreleri değiştirerek sonuçların duyarlılığını test edebilirsiniz.</p>
          </div>
          {engine && (
            <div className="engine-badges">
              <span className="tag-pill"><Database size={12} /> {engine.article_count} haber · {engine.year_count} yıl</span>
              <span className="tag-pill">Duygu: {engine.sentiment_backend}</span>
              <span className="tag-pill">Gömme: {engine.embedding_backend}</span>
            </div>
          )}
        </div>
        {engine && engine.article_count < 200 && (
          <Notice tone="warn">
            Arşiv şu an {engine.article_count} haber içeriyor. Bu hacimde anlamlılık testleri zayıftır; sonuçlar yöntemi göstermek içindir. Laboratuvardaki kazıyıcılarla veri ekledikçe tüm metrikler otomatik güncellenir.
          </Notice>
        )}
        <div className="section-tabs">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} className={`section-tab ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)}>
                <Icon size={15} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div key={section} className="fade-up">{SectionBody[section]}</div>
    </div>
  );
}
