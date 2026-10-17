"""
MedyaTarih - Akademik İstatistik Motoru
=======================================
Tüm metrikler veritabanındaki gerçek makalelerden hesaplanır.

 1. Göreli Frekans (PPM)              RF(w,t) = f(w,t) / Σ f(i,t) × 10^6
 2. TF-IDF (dönemsel özgünlük)        TF(w,d) × log(N / (1 + df(w)))
 3. Monroe Log-Odds (Dirichlet prior) δ_w = log[(y_i+α)/(n_i+α0-y_i-α)] - log[(y_j+α)/(n_j+α0-y_j-α)]
                                      Z_w = δ_w / sqrt(1/(y_i+α) + 1/(y_j+α))
 4. Sürekli Duygu + EMA               S_i = P(+) - P(-),  EMA_t = a·S_t + (1-a)·EMA_{t-1},  a = 2/(k+1)
 5. Rolling Z-Score                   Z_t = (x_t - μ_{t,k}) / σ_{t,k}   (yalnızca geçmiş k gözlem)
 6. CUSUM (iki yönlü)                 S+_t = max(0, S+_{t-1} + z_t - k),  S-_t = max(0, S-_{t-1} - z_t - k)
 7. Esteban-Ray                       P = K Σ_i Σ_j π_i^(1+α) π_j |s_i - s_j|
 8. Jensen-Shannon Iraksaması         JSD = ½ KL(P||M) + ½ KL(Q||M),  M = ½(P+Q)   (log2, [0,1])
 9. Kosinüs Söylem Uzaklığı           1 - (μ_A · μ_B) / (||μ_A|| ||μ_B||)
10. Çapraz Korelasyon                 r(ℓ) = corr(kriz_t, direniş_{t+ℓ})
"""

import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Sequence

import numpy as np
from scipy.spatial.distance import cosine as cosine_distance
from scipy.spatial.distance import jensenshannon
from scipy.stats import pearsonr
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

from app.database import get_connection
from app.nlp.class_sentiment import SinifsalDuyguMotoru
from app.nlp import bert_backend

# ---------------------------------------------------------------------
# Sabitler
# ---------------------------------------------------------------------
TURKISH_STOPWORDS = [
    "ve", "bir", "bu", "da", "de", "için", "ile", "mi", "mı", "ama", "gibi", "daha",
    "çok", "en", "ise", "olarak", "olan", "her", "kadar", "sonra", "önce", "ne", "var",
    "yok", "tarafından", "şekilde", "ancak", "yeni", "ilk", "son", "tüm", "bin", "milyon",
    "milyar", "yüzde", "dedi", "etti", "oldu", "olduğu", "ki", "o", "bu", "şu", "ya",
    "veya", "hem", "ayrıca", "üzerine", "karşı", "göre", "rağmen", "the", "a",
]

# Basın blokları (newspaper_type alanına göre)
PRESS_BLOCKS: Dict[str, Dict[str, Any]] = {
    "muhalif_bagimsiz": {"label": "Muhalif & Bağımsız Basın", "types": ["sol", "muhalif"]},
    "iktidar_yanlisi": {"label": "İktidar Yanlısı & Sağ Basın", "types": ["iktidar", "sag"]},
    "merkez": {"label": "Merkez / Ana Akım Basın", "types": ["merkez"]},
    "ekonomi": {"label": "Ekonomi Basını", "types": ["ekonomi"]},
}

DEFAULT_CRISIS_TERMS = ["enflasyon", "devalüasyon", "dolar", "faiz", "kriz", "zam", "imf", "iflas"]

_class_engine = SinifsalDuyguMotoru()


# ---------------------------------------------------------------------
# Yardımcılar
# ---------------------------------------------------------------------
def tr_lower(text: str) -> str:
    """Türkçe'ye duyarlı küçük harf dönüşümü (I -> ı, İ -> i)."""
    return (text or "").replace("I", "ı").replace("İ", "i").lower()


def tokenize(text: str, drop_stopwords: bool = True) -> List[str]:
    tokens = re.findall(r"[a-zçğıöşüâîû]+", tr_lower(text))
    if drop_stopwords:
        stop = set(TURKISH_STOPWORDS)
        tokens = [t for t in tokens if t not in stop and len(t) > 1]
    return tokens


def _safe(v: Optional[float], nd: int = 4) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return round(float(v), nd)


def load_articles() -> List[Dict[str, Any]]:
    """Veritabanındaki makaleleri metin ve sınıfsal mercek skorlarıyla birlikte yükler."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, title, content, source, newspaper_type, year, date, category, "
        "sentiment_score, crisis_score, polarization_score FROM articles ORDER BY date ASC"
    ).fetchall()
    conn.close()

    articles = []
    texts = [f"{r['title']}. {r['content'] or ''}" for r in rows]
    bert_scores = bert_backend.continuous_sentiment(texts)  # None ise sözlük skoru kullanılır

    for idx, r in enumerate(rows):
        text = texts[idx]
        lens = _class_engine.analiz_et_tekil(text)
        sentiment = bert_scores[idx] if bert_scores is not None else (r["sentiment_score"] or 0.0)
        articles.append({
            "id": r["id"],
            "text": text,
            "source": r["source"],
            "newspaper_type": r["newspaper_type"],
            "year": int(r["year"]),
            "date": r["date"],
            "category": r["category"],
            "sentiment": float(sentiment),
            "crisis": float(r["crisis_score"] or 0.0),
            "polarization": float(r["polarization_score"] or 0.0),
            "direnis": float(lens["direnis_dinamizmi"]),
            "yapisal_kriz": float(lens["yapisal_kriz_yuku"]),
            "halk_odakli": float(lens["halk_odakli_duygu"]),
        })
    return articles


def year_grid(articles: List[Dict[str, Any]]) -> List[int]:
    years = sorted({a["year"] for a in articles})
    return years


def filter_block(articles: List[Dict[str, Any]], block_key: str) -> List[Dict[str, Any]]:
    types = PRESS_BLOCKS.get(block_key, {}).get("types", [])
    return [a for a in articles if a["newspaper_type"] in types]


# ---------------------------------------------------------------------
# 1. Göreli Frekans (PPM)
# ---------------------------------------------------------------------
def relative_frequency(articles: List[Dict[str, Any]], terms: Sequence[str]) -> Dict[str, Any]:
    years = year_grid(articles)
    terms = [tr_lower(t.strip()) for t in terms if t.strip()]
    by_year_tokens: Dict[int, int] = Counter()
    by_year_text: Dict[int, List[str]] = {y: [] for y in years}

    for a in articles:
        by_year_tokens[a["year"]] += len(tokenize(a["text"], drop_stopwords=False))
        by_year_text[a["year"]].append(tr_lower(a["text"]))

    series = {}
    totals = {}
    for term in terms:
        pattern = re.compile(r"\b" + re.escape(term))  # kök eşleşmesi: "enflasyon" -> "enflasyonun"
        values = []
        total_count = 0
        for y in years:
            count = sum(len(pattern.findall(t)) for t in by_year_text[y])
            total_count += count
            denom = by_year_tokens[y] or 1
            values.append({"year": y, "count": count, "ppm": round(count / denom * 1e6, 1)})
        series[term] = values
        totals[term] = total_count

    return {
        "years": years,
        "token_totals": {y: by_year_tokens[y] for y in years},
        "series": series,
        "totals": totals,
    }


# ---------------------------------------------------------------------
# 2. TF-IDF (yıl = belge)
# ---------------------------------------------------------------------
def tfidf_by_year(articles: List[Dict[str, Any]], top_n: int = 10) -> Dict[int, List[Dict[str, Any]]]:
    years = year_grid(articles)
    docs = [" ".join(tokenize(" ".join(a["text"] for a in articles if a["year"] == y))) for y in years]
    if not any(docs):
        return {}

    cv = CountVectorizer(ngram_range=(1, 2), token_pattern=r"(?u)\b\w+\b")
    X = cv.fit_transform(docs).toarray().astype(float)
    vocab = cv.get_feature_names_out()
    N = X.shape[0]
    df = (X > 0).sum(axis=0)
    idf = np.log(N / (1.0 + df))  # kullanıcı formülü: log(N / (1 + df))
    row_sums = X.sum(axis=1, keepdims=True)
    tf = X / np.maximum(row_sums, 1.0)
    scores = tf * idf

    result = {}
    for i, y in enumerate(years):
        order = np.argsort(-scores[i])
        terms = []
        for j in order[:top_n]:
            if scores[i, j] <= 0:
                break
            terms.append({"term": vocab[j], "tfidf": round(float(scores[i, j]), 5), "count": int(X[i, j])})
        result[y] = terms
    return result


# ---------------------------------------------------------------------
# 3. Monroe Log-Odds (Informative Dirichlet Prior)
# ---------------------------------------------------------------------
def monroe_log_odds(corpus_a: List[str], corpus_b: List[str],
                    prior_corpus: Optional[List[str]] = None,
                    min_count: int = 1, top_n: int = 15) -> Dict[str, Any]:
    if not corpus_a or not corpus_b:
        return {"a_terms": [], "b_terms": [], "n_a": 0, "n_b": 0, "vocab_size": 0}

    prior_corpus = prior_corpus or (list(corpus_a) + list(corpus_b))
    analyzer = lambda doc: tokenize(doc)  # noqa: E731
    cv = CountVectorizer(analyzer=analyzer)
    cv.fit(prior_corpus)
    vocab = cv.get_feature_names_out()

    y_a = np.asarray(cv.transform(corpus_a).sum(axis=0)).ravel().astype(float)
    y_b = np.asarray(cv.transform(corpus_b).sum(axis=0)).ravel().astype(float)
    alpha = np.asarray(cv.transform(prior_corpus).sum(axis=0)).ravel().astype(float)

    n_a, n_b, a0 = y_a.sum(), y_b.sum(), alpha.sum()
    eps = 1e-9
    delta = (np.log((y_a + alpha) / np.maximum(n_a + a0 - y_a - alpha, eps))
             - np.log((y_b + alpha) / np.maximum(n_b + a0 - y_b - alpha, eps)))
    var = 1.0 / (y_a + alpha) + 1.0 / (y_b + alpha)
    z = delta / np.sqrt(var)

    mask = (y_a + y_b) >= min_count
    rows = [
        {"term": vocab[i], "count_a": int(y_a[i]), "count_b": int(y_b[i]),
         "delta": round(float(delta[i]), 4), "z": round(float(z[i]), 3)}
        for i in np.where(mask)[0]
    ]
    rows.sort(key=lambda r: r["z"], reverse=True)
    return {
        "a_terms": [r for r in rows if r["z"] > 0][:top_n],
        "b_terms": sorted([r for r in rows if r["z"] < 0], key=lambda r: r["z"])[:top_n],
        "n_a": int(n_a), "n_b": int(n_b), "vocab_size": int(len(vocab)),
        "significant_count": int(sum(1 for r in rows if abs(r["z"]) >= 1.96)),
    }


# ---------------------------------------------------------------------
# 4-6. Zaman serisi araçları: EMA, Rolling Z, CUSUM
# ---------------------------------------------------------------------
def ema(values: List[Optional[float]], span: int) -> List[Optional[float]]:
    a = 2.0 / (span + 1.0)
    out, prev = [], None
    for v in values:
        if v is None:
            out.append(prev)
            continue
        prev = v if prev is None else a * v + (1 - a) * prev
        out.append(prev)
    return [_safe(v) for v in out]


def rolling_zscore(values: List[Optional[float]], window: int = 5, min_periods: int = 3) -> List[Optional[float]]:
    """Z_t = (x_t - μ) / σ ; μ ve σ yalnızca önceki `window` gözlemden (sızıntısız)."""
    out = []
    history: List[float] = []
    for v in values:
        past = history[-window:]
        if v is None or len(past) < min_periods:
            out.append(None)
        else:
            mu, sd = float(np.mean(past)), float(np.std(past, ddof=1))
            out.append(_safe((v - mu) / sd, 3) if sd > 1e-9 else None)
        if v is not None:
            history.append(v)
    return out


def cusum(values: List[Optional[float]], k: float = 0.5, h: float = 3.0) -> Dict[str, Any]:
    """İki yönlü standardize CUSUM. h aşıldığında rejim değişikliği işaretlenir ve sıfırlanır."""
    clean = [v for v in values if v is not None]
    if len(clean) < 3:
        return {"s_pos": [None] * len(values), "s_neg": [None] * len(values), "changepoints": []}
    mu0, sd = float(np.mean(clean)), float(np.std(clean, ddof=1)) or 1.0
    s_pos = s_neg = 0.0
    pos_out, neg_out, cps = [], [], []
    for i, v in enumerate(values):
        if v is None:
            pos_out.append(None)
            neg_out.append(None)
            continue
        z = (v - mu0) / sd
        s_pos = max(0.0, s_pos + z - k)
        s_neg = max(0.0, s_neg - z - k)
        pos_out.append(round(s_pos, 3))
        neg_out.append(round(s_neg, 3))
        if s_pos > h:
            cps.append({"index": i, "direction": "yukari"})
            s_pos = 0.0
        elif s_neg > h:
            cps.append({"index": i, "direction": "asagi"})
            s_neg = 0.0
    return {"s_pos": pos_out, "s_neg": neg_out, "changepoints": cps, "mu0": round(mu0, 4), "sigma": round(sd, 4)}


# ---------------------------------------------------------------------
# 7-9. Kutuplaşma metrikleri
# ---------------------------------------------------------------------
def esteban_ray(scores: Sequence[float], alpha: float = 1.3, bins: int = 5) -> Optional[float]:
    """K, iki eşit kütlenin uçlarda toplandığı durumda indeks 1 olacak şekilde seçilir."""
    scores = [s for s in scores if s is not None]
    if len(scores) < 2:
        return None
    counts, edges = np.histogram(scores, bins=bins, range=(-1.0, 1.0))
    pi = counts / counts.sum()
    s = 0.5 * (edges[:-1] + edges[1:])
    raw = sum(pi[i] ** (1 + alpha) * pi[j] * abs(s[i] - s[j]) for i in range(bins) for j in range(bins))
    # Normalizasyon: kütleler en uç iki kutuda yarı yarıya (maksimum ayrışma)
    max_raw = 2 * (0.5 ** (1 + alpha)) * 0.5 * abs(s[-1] - s[0])
    return _safe(raw / max_raw if max_raw > 0 else 0.0)


def jensen_shannon(texts_a: List[str], texts_b: List[str]) -> Optional[float]:
    ca, cb = Counter(), Counter()
    for t in texts_a:
        ca.update(tokenize(t))
    for t in texts_b:
        cb.update(tokenize(t))
    if not ca or not cb:
        return None
    vocab = sorted(set(ca) | set(cb))
    p = np.array([ca[w] for w in vocab], dtype=float)
    q = np.array([cb[w] for w in vocab], dtype=float)
    d = jensenshannon(p / p.sum(), q / q.sum(), base=2)  # sqrt(JSD) döner
    return _safe(float(d) ** 2)


def cosine_polarization(texts_a: List[str], texts_b: List[str], fit_corpus: List[str]) -> Optional[float]:
    if not texts_a or not texts_b:
        return None
    emb = bert_backend.embed(texts_a + texts_b)
    if emb is not None:
        ea, eb = emb[: len(texts_a)], emb[len(texts_a):]
    else:
        vec = TfidfVectorizer(analyzer=lambda d: tokenize(d))
        vec.fit(fit_corpus)
        ea = vec.transform(texts_a).toarray()
        eb = vec.transform(texts_b).toarray()
    mu_a, mu_b = ea.mean(axis=0), eb.mean(axis=0)
    if not np.any(mu_a) or not np.any(mu_b):
        return None
    return _safe(float(cosine_distance(mu_a, mu_b)))


# ---------------------------------------------------------------------
# 10. Çapraz Korelasyon (yıllık ızgara üzerinde)
# ---------------------------------------------------------------------
def cross_correlation(x: Dict[int, float], y: Dict[int, float], max_lag: int = 4, min_pairs: int = 5) -> Dict[str, Any]:
    """r(ℓ) = corr(x_t, y_{t+ℓ}); ℓ > 0 ise x (kriz) y'den (direniş) önce gelir."""
    lags = []
    for lag in range(-max_lag, max_lag + 1):
        pairs = [(x[t], y[t + lag]) for t in x if (t + lag) in y]
        n = len(pairs)
        r = p = None
        if n >= 3:
            xs, ys = np.array([q[0] for q in pairs]), np.array([q[1] for q in pairs])
            if xs.std() > 1e-9 and ys.std() > 1e-9:
                r, p = pearsonr(xs, ys)
        lags.append({"lag": lag, "r": _safe(r, 3), "p": _safe(p, 4), "n": n})

    valid = [l for l in lags if l["r"] is not None and l["n"] >= min_pairs]
    best = max(valid, key=lambda l: abs(l["r"])) if valid else None
    significant = bool(best and best["p"] is not None and best["p"] < 0.05)
    return {"lags": lags, "best": best, "sufficient": best is not None,
            "significant": significant, "min_pairs": min_pairs}


# ---------------------------------------------------------------------
# Üst düzey seri üreticiler (router'lar bunları çağırır)
# ---------------------------------------------------------------------
def yearly_mean(articles: List[Dict[str, Any]], field: str, years: List[int]) -> List[Optional[float]]:
    out = []
    for y in years:
        vals = [a[field] for a in articles if a["year"] == y]
        out.append(_safe(float(np.mean(vals))) if vals else None)
    return out


def sentiment_series(articles: List[Dict[str, Any]], lens: str = "ham", span: int = 3,
                     window: int = 5, z_threshold: float = 1.96, k: float = 0.5, h: float = 3.0) -> Dict[str, Any]:
    field = "halk_odakli" if lens == "halk" else "sentiment"
    years = year_grid(articles)
    mean = yearly_mean(articles, field, years)
    z = rolling_zscore(mean, window=window)
    cs = cusum(mean, k=k, h=h)
    counts = [sum(1 for a in articles if a["year"] == y) for y in years]
    return {
        "lens": lens,
        "years": years,
        "counts": counts,
        "mean": mean,
        "ema": ema(mean, span),
        "rolling_z": z,
        "anomalies": [{"year": years[i], "z": z[i]} for i in range(len(years)) if z[i] is not None and abs(z[i]) >= z_threshold],
        "cusum": {**cs, "changepoints": [{**c, "year": years[c["index"]]} for c in cs["changepoints"]]},
        "params": {"span": span, "alpha": round(2 / (span + 1), 3), "window": window, "z_threshold": z_threshold, "k": k, "h": h},
    }


def frequency_series(articles: List[Dict[str, Any]], terms: Sequence[str], window: int = 5,
                     z_threshold: float = 1.96) -> Dict[str, Any]:
    rf = relative_frequency(articles, terms)
    for term, values in rf["series"].items():
        ppm = [v["ppm"] for v in values]
        z = rolling_zscore(ppm, window=window)
        for v, zz in zip(values, z):
            v["rolling_z"] = zz
            v["anomaly"] = zz is not None and abs(zz) >= z_threshold
    rf["params"] = {"window": window, "z_threshold": z_threshold}
    return rf


def polarization_series(articles: List[Dict[str, Any]], block_a: str, block_b: str, alpha: float = 1.3) -> Dict[str, Any]:
    years = year_grid(articles)
    fit_corpus = [a["text"] for a in articles]
    rows = []
    for y in years:
        ya = [a for a in articles if a["year"] == y]
        ta = [a["text"] for a in filter_block(ya, block_a)]
        tb = [a["text"] for a in filter_block(ya, block_b)]
        rows.append({
            "year": y,
            "n": len(ya),
            "n_a": len(ta),
            "n_b": len(tb),
            "esteban_ray": esteban_ray([a["sentiment"] for a in ya], alpha=alpha),
            "jsd": jensen_shannon(ta, tb) if ta and tb else None,
            "cosine": cosine_polarization(ta, tb, fit_corpus) if ta and tb else None,
        })

    all_a = [a["text"] for a in filter_block(articles, block_a)]
    all_b = [a["text"] for a in filter_block(articles, block_b)]
    return {
        "block_a": {"key": block_a, **PRESS_BLOCKS.get(block_a, {})},
        "block_b": {"key": block_b, **PRESS_BLOCKS.get(block_b, {})},
        "series": rows,
        "overall": {
            "esteban_ray": esteban_ray([a["sentiment"] for a in articles], alpha=alpha),
            "jsd": jensen_shannon(all_a, all_b),
            "cosine": cosine_polarization(all_a, all_b, fit_corpus),
            "n_a": len(all_a),
            "n_b": len(all_b),
        },
        "embedding_backend": bert_backend.embedding_backend_name(),
        "params": {"alpha": alpha},
    }


def class_lens_series(articles: List[Dict[str, Any]], max_lag: int = 4) -> Dict[str, Any]:
    """Ek mercek: yapısal kriz yükü ile toplumsal hareket dinamizminin yıllık serisi + çapraz korelasyon."""
    years = year_grid(articles)
    kriz = yearly_mean(articles, "yapisal_kriz", years)
    direnis = yearly_mean(articles, "direnis", years)
    ham = yearly_mean(articles, "sentiment", years)
    halk = yearly_mean(articles, "halk_odakli", years)
    timeline = [
        {"year": y, "total_articles": sum(1 for a in articles if a["year"] == y),
         "yapisal_kriz_yuku": kriz[i], "direnis_dinamizmi": direnis[i],
         "ham_bert_skoru": ham[i], "halk_odakli_duygu": halk[i]}
        for i, y in enumerate(years)
    ]
    xc = cross_correlation(
        {y: kriz[i] for i, y in enumerate(years) if kriz[i] is not None},
        {y: direnis[i] for i, y in enumerate(years) if direnis[i] is not None},
        max_lag=max_lag,
    )
    return {"timeline": timeline, "cross_correlation": xc}
