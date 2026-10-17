/**
 * MedyaTarih Frontend API Servis Katmanı
 * Not: Bağlantı hatasında sahte veri üretilmez; boş yapı döner ve arayüz "veri yok" gösterir.
 */

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8008/api';

async function getJson(path, fallback) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API hatası (${path}):`, err);
    return fallback;
  }
}

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`İstek başarısız (HTTP ${res.status})`);
  return await res.json();
}

const qs = (params) => new URLSearchParams(
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
).toString();

/* ---------- Genel analitik ---------- */
export const fetchOverviewStats = () => getJson('/stats/overview', null);
export const fetchTimelineData = (from = 1970, to = 2024) => getJson(`/timeline?${qs({ year_from: from, year_to: to })}`, { timeline: [] });
export const fetchClassDualAxisTimeline = (maxLag = 4) => getJson(`/timeline/class-dual-axis?max_lag=${maxLag}`, { timeline: [], cross_correlation: null });
export const fetchArticles = (params = {}) => getJson(`/articles?${qs(params)}`, { total: 0, articles: [] });
export const fetchCrisisRadar = () => getJson('/discourse/crisis-radar', { dimensions: [], term_counts: [], peak_crisis_articles: [] });
export const fetchPolarizationData = () => getJson('/discourse/polarization', { press_blocks: [], highest_polarization_headlines: [] });

/* ---------- İstatistik motoru (/api/stats/*) ---------- */
export const fetchEngineInfo = () => getJson('/stats/engine', null);
export const fetchFrequency = (terms, window = 5, zThreshold = 1.96) =>
  getJson(`/stats/frequency?${qs({ terms: terms.join(','), window, z_threshold: zThreshold })}`, null);
export const fetchTfidf = (topN = 10) => getJson(`/stats/tfidf?top_n=${topN}`, { years: [], by_year: {} });
export const fetchLogOdds = ({ mode = 'block', a, b, topN = 12 }) =>
  getJson(`/stats/log-odds?${qs({ mode, a, b, top_n: topN })}`, null);
export const fetchSentimentSeries = (params = {}) => getJson(`/stats/sentiment-series?${qs(params)}`, null);
export const fetchPolarizationSeries = (a, b, alpha = 1.3) =>
  getJson(`/stats/polarization-series?${qs({ a, b, alpha })}`, null);
export const syncLiveRss = (limit = 40) => postJson(`/stats/sync-live-rss?limit=${limit}`, {});

/* ---------- Laboratuvar ---------- */
export const analyzeClassSentiment = (text, gamma = 0.85) => postJson('/lab/sinifsal-analiz', { text, gamma });
export const correctOcrText = (text, maxDistance = 2) => postJson('/lab/ocr-duzelt', { text, max_distance: maxDistance });
export const fetchClassFraming = (emek, sermaye) => postJson('/lab/log-odds-framing', { emek_metinleri: emek, sermaye_metinleri: sermaye });
export const fetchHalkRss = (kaynakTipi = 'emek', limit = 6) =>
  getJson(`/lab/halk-rss?${qs({ kaynak_tipi: kaynakTipi, limit })}`, { kaynak_tipi: kaynakTipi, toplam: 0, haberler: [] });

export async function uploadOcrFile(formData) {
  const res = await fetch(`${BASE_URL}/lab/ocr`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('OCR isteği başarısız oldu');
  return await res.json();
}
