/**
 * MedyaTarih Frontend API Servis Katmanı
 * Çift modlu mimari:
 * 1. Arka uç (FastAPI) devredeyken tüm analitik istekleri doğrudan yerel/uzak REST API'ye iletilir.
 * 2. Arka uç erişilemez durumdaysa (örneğin GitHub Pages üzerinde statik demo olarak gezinilirken)
 *    önceden derlenmiş külliyat verisi (staticData.js) ve istemci tarafı hesaplama motoru devreye girer.
 */

import {
  STATIC_ARTICLES,
  STATIC_OVERVIEW,
  STATIC_ENGINE,
  STATIC_DUAL_AXIS,
  STATIC_SENTIMENT_HALK,
  STATIC_SENTIMENT_HAM,
  STATIC_LOGODDS,
  STATIC_CRISIS_RADAR,
  STATIC_POLARIZATION,
  STATIC_TFIDF
} from '../data/staticData';

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8008/api';

async function getJson(path, fallbackValue = null) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Arka uca ulaşılamadığında statik demo modu sessizce devralır
    return fallbackValue;
  }
}

async function postJson(path, body, fallbackValue = null) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`İstek başarısız (HTTP ${res.status})`);
    return await res.json();
  } catch (err) {
    return fallbackValue;
  }
}

const qs = (params) => new URLSearchParams(
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
).toString();

/* ---------- Genel analitik ---------- */
export const fetchOverviewStats = async () => {
  const data = await getJson('/stats/overview', null);
  return data || STATIC_OVERVIEW;
};

export const fetchTimelineData = async (from = 1970, to = 2026) => {
  const data = await getJson(`/timeline?${qs({ year_from: from, year_to: to })}`, null);
  return data || { timeline: STATIC_DUAL_AXIS?.timeline || [] };
};

export const fetchClassDualAxisTimeline = async (maxLag = 4) => {
  const data = await getJson(`/timeline/class-dual-axis?max_lag=${maxLag}`, null);
  return data || STATIC_DUAL_AXIS;
};

export const fetchArticles = async (params = {}) => {
  const data = await getJson(`/articles?${qs(params)}`, null);
  if (data && data.articles) return data;

  // İstemci tarafı arama ve filtreleme yedek motoru
  let filtered = [...STATIC_ARTICLES];
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter(a =>
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q)) ||
      (a.keywords && JSON.stringify(a.keywords).toLowerCase().includes(q))
    );
  }
  if (params.source && params.source !== 'ALL') {
    filtered = filtered.filter(a => a.source === params.source);
  }
  if (params.category && params.category !== 'ALL') {
    filtered = filtered.filter(a => a.category === params.category);
  }
  if (params.year) {
    filtered = filtered.filter(a => a.year === parseInt(params.year));
  }
  if (params.sentiment && params.sentiment !== 'ALL') {
    filtered = filtered.filter(a => a.sentiment_label === params.sentiment);
  }

  const limit = params.limit ? parseInt(params.limit) : 100;
  const offset = params.offset ? parseInt(params.offset) : 0;
  return {
    total: filtered.length,
    limit,
    offset,
    articles: filtered.slice(offset, offset + limit)
  };
};

export const fetchCrisisRadar = async () => {
  const data = await getJson('/discourse/crisis-radar', null);
  return data || STATIC_CRISIS_RADAR;
};

export const fetchPolarizationData = async () => {
  const data = await getJson('/discourse/polarization', null);
  return data || STATIC_POLARIZATION;
};

/* ---------- İstatistik motoru (/api/stats/*) ---------- */
export const fetchEngineInfo = async () => {
  const data = await getJson('/stats/engine', null);
  return data || STATIC_ENGINE;
};

export const fetchFrequency = async (terms, window = 5, zThreshold = 1.96) => {
  const termsList = Array.isArray(terms) ? terms : [terms];
  const data = await getJson(`/stats/frequency?${qs({ terms: termsList.join(','), window, z_threshold: zThreshold })}`, null);
  if (data) return data;

  // İstemci tarafı PPM (Milyon Sözcük Başına Frekans) Hesaplayıcı
  const years = Array.from(new Set(STATIC_ARTICLES.map(a => a.year))).sort((a, b) => a - b);
  const byTerm = {};

  termsList.forEach(term => {
    const t = term.toLowerCase().trim();
    const ppmValues = [];
    const rawCounts = [];

    years.forEach(yr => {
      const yearArts = STATIC_ARTICLES.filter(a => a.year === yr);
      let matchCount = 0;
      let totalWords = 0;

      yearArts.forEach(art => {
        const text = `${art.title || ''} ${art.content || ''}`.toLowerCase();
        const words = text.split(/\s+/).filter(Boolean);
        totalWords += words.length;
        const matches = text.split(t).length - 1;
        if (matches > 0) matchCount += matches;
      });

      const safeTotalWords = Math.max(totalWords, 50);
      const ppm = Math.round((matchCount / safeTotalWords) * 1_000_000);
      rawCounts.push(matchCount);
      ppmValues.push(ppm);
    });

    byTerm[term] = {
      raw_counts: rawCounts,
      ppm: ppmValues,
      total_occurrences: rawCounts.reduce((a, b) => a + b, 0),
      anomalies: []
    };
  });

  return {
    years,
    terms: byTerm
  };
};

export const fetchTfidf = async (topN = 10) => {
  const data = await getJson(`/stats/tfidf?top_n=${topN}`, null);
  return data || STATIC_TFIDF;
};

export const fetchLogOdds = async ({ mode = 'block', a, b, topN = 12 }) => {
  const data = await getJson(`/stats/log-odds?${qs({ mode, a, b, top_n: topN })}`, null);
  if (data) return data;

  const key = `${mode}:${a}:${b}`;
  if (STATIC_LOGODDS && STATIC_LOGODDS[key]) {
    return STATIC_LOGODDS[key];
  }
  // Alternatif dönem eşleştirmesi
  return STATIC_LOGODDS?.['period:1994-2001:2020-2026'] || null;
};

export const fetchSentimentSeries = async (params = {}) => {
  const lens = params.lens || 'halk';
  const data = await getJson(`/stats/sentiment-series?${qs(params)}`, null);
  if (data) return data;
  return lens === 'ham' ? STATIC_SENTIMENT_HAM : STATIC_SENTIMENT_HALK;
};

export const fetchPolarizationSeries = async (a, b, alpha = 1.3) => {
  const data = await getJson(`/stats/polarization-series?${qs({ a, b, alpha })}`, null);
  return data || null;
};

export const syncLiveRss = async (limit = 40) => {
  const res = await postJson(`/stats/sync-live-rss?limit=${limit}`, {}, null);
  if (res) return res;
  return {
    success: true,
    total_added: 0,
    total_articles: STATIC_ARTICLES.length,
    message: 'Canlı akış yalnızca yerel Python sunucusu çalışırken güncellenebilir.'
  };
};

/* ---------- Laboratuvar & OCR Düzeltme ---------- */
export const analyzeClassSentiment = async (text, gamma = 0.85) => {
  const res = await postJson('/lab/sinifsal-analiz', { text, gamma }, null);
  return res || { score: 0.0, label: 'nötr' };
};

export const correctOcrText = async (text, maxDistance = 2) => {
  const res = await postJson('/lab/ocr-duzelt', { text, max_distance: maxDistance }, null);
  if (res) return res;

  // İstemci tarafı pratik Türkçe OCR hata onarıcı
  const replacements = [
    [/Met4l/g, 'Metal'],
    [/1sç1ler1/g, 'işçileri'],
    [/1şçi/g, 'işçi'],
    [/zammlanna/g, 'zamlarına'],
    [/karşi/g, 'karşı'],
    [/fabr1kada/g, 'fabrikada'],
    [/qrev/g, 'grev'],
    [/ald1/g, 'aldı'],
    [/1/g, 'i'],
    [/0/g, 'o']
  ];
  let fixed = text;
  let count = 0;
  replacements.forEach(([pattern, rep]) => {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, rep);
      count++;
    }
  });

  return {
    orijinal_metin: text,
    duzeltilmis_metin: fixed,
    duzeltilen_kelime_sayisi: count
  };
};

export const fetchClassFraming = (emek, sermaye) => postJson('/lab/log-odds-framing', { emek_metinleri: emek, sermaye_metinleri: sermaye });

export const fetchHalkRss = async (kaynakTipi = 'emek', limit = 6) => {
  const data = await getJson(`/lab/halk-rss?${qs({ kaynak_tipi: kaynakTipi, limit })}`, null);
  return data || { kaynak_tipi: kaynakTipi, toplam: 0, haberler: [] };
};

export async function uploadOcrFile(formData) {
  const res = await fetch(`${BASE_URL}/lab/ocr`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('OCR isteği başarısız oldu');
  return await res.json();
}
