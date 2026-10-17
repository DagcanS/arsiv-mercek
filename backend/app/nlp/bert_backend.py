"""
İsteğe Bağlı BERTurk Arka Ucu
=============================
Varsayılan olarak KAPALI. Açmak için:

    pip install torch transformers
    export MEDYATARIH_USE_BERT=1

Kapalıyken (veya kütüphaneler yoksa) fonksiyonlar None döner ve istatistik motoru
sözlük tabanlı duygu skorlarına ve TF-IDF merkez vektörlerine düşer.
Hangi arka ucun kullanıldığı /api/stats/engine uç noktasında açıkça raporlanır.
"""

import os
from functools import lru_cache
from typing import List, Optional

import numpy as np

SENTIMENT_MODEL = os.getenv("MEDYATARIH_SENTIMENT_MODEL", "savasy/bert-base-turkish-sentiment-cased")
EMBEDDING_MODEL = os.getenv("MEDYATARIH_EMBEDDING_MODEL", "dbmdz/bert-base-turkish-cased")


def enabled() -> bool:
    return os.getenv("MEDYATARIH_USE_BERT", "0") == "1"


@lru_cache(maxsize=1)
def _load_sentiment():
    if not enabled():
        return None
    try:
        import torch  # noqa: F401
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
        tok = AutoTokenizer.from_pretrained(SENTIMENT_MODEL)
        model = AutoModelForSequenceClassification.from_pretrained(SENTIMENT_MODEL)
        model.eval()
        return tok, model
    except Exception as exc:  # pragma: no cover
        print(f"[BERT] Duygu modeli yüklenemedi, sözlük motoruna düşülüyor: {exc}")
        return None


@lru_cache(maxsize=1)
def _load_encoder():
    if not enabled():
        return None
    try:
        import torch  # noqa: F401
        from transformers import AutoModel, AutoTokenizer
        tok = AutoTokenizer.from_pretrained(EMBEDDING_MODEL)
        model = AutoModel.from_pretrained(EMBEDDING_MODEL)
        model.eval()
        return tok, model
    except Exception as exc:  # pragma: no cover
        print(f"[BERT] Gömme modeli yüklenemedi, TF-IDF'e düşülüyor: {exc}")
        return None


def continuous_sentiment(texts: List[str], batch_size: int = 16) -> Optional[List[float]]:
    """S_i = P(Pozitif|x) - P(Negatif|x). Model yoksa None."""
    loaded = _load_sentiment()
    if loaded is None or not texts:
        return None
    import torch
    import torch.nn.functional as F
    tok, model = loaded

    # Etiket indekslerini id2label üzerinden bul (2 veya 3 sınıflı modeller)
    labels = {i: str(l).lower() for i, l in model.config.id2label.items()}
    pos_idx = next((i for i, l in labels.items() if "pos" in l), 1)
    neg_idx = next((i for i, l in labels.items() if "neg" in l), 0)

    scores: List[float] = []
    for i in range(0, len(texts), batch_size):
        batch = tok(texts[i:i + batch_size], padding=True, truncation=True, max_length=128, return_tensors="pt")
        with torch.no_grad():
            probs = F.softmax(model(**batch).logits, dim=-1).numpy()
        scores.extend((probs[:, pos_idx] - probs[:, neg_idx]).tolist())
    return scores


def embed(texts: List[str], batch_size: int = 16) -> Optional[np.ndarray]:
    """Attention-mask ağırlıklı Mean Pooling ile 768 boyutlu cümle vektörleri. Model yoksa None."""
    loaded = _load_encoder()
    if loaded is None or not texts:
        return None
    import torch
    tok, model = loaded
    out = []
    for i in range(0, len(texts), batch_size):
        enc = tok(texts[i:i + batch_size], padding=True, truncation=True, max_length=128, return_tensors="pt")
        with torch.no_grad():
            hidden = model(**enc).last_hidden_state
        mask = enc["attention_mask"].unsqueeze(-1).float()
        out.append(((hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-9)).numpy())
    return np.vstack(out)


def sentiment_backend_name() -> str:
    return f"BERTurk ({SENTIMENT_MODEL})" if _load_sentiment() is not None else "Sözlük tabanlı (lexicon v2)"


def embedding_backend_name() -> str:
    return f"BERTurk Mean Pooling ({EMBEDDING_MODEL})" if _load_encoder() is not None else "TF-IDF merkez vektörü"
