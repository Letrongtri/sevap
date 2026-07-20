"""
embedding_model.py
──────────────────
Singleton SentenceTransformer hoặc Modal HTTP adapter.

Nếu MODAL_EMBEDDING_URL được set → gọi Modal GPU endpoint (nhanh hơn, không tốn RAM local).
Ngược lại → load model local như cũ (fallback).
"""

import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.core.logging import logger

_embedding_model = None


class ModalEmbeddingAdapter:
    """
    Drop-in replacement cho SentenceTransformer.
    Gọi Modal HTTP endpoint thay vì chạy model local.
    Interface tương thích: .encode(texts, normalize_embeddings=True) → np.ndarray
    """

    def __init__(self, url: str):
        self.url = url
        import httpx
        self._client = httpx.Client(timeout=60.0)

    def encode(self, sentences, normalize_embeddings: bool = True, **kwargs) -> np.ndarray:
        is_single = isinstance(sentences, str)
        if is_single:
            sentences = [sentences]
        response = self._client.post(
            self.url,
            json={"texts": sentences, "normalize": normalize_embeddings},
        )
        response.raise_for_status()
        data = response.json()
        embeddings = data.get("embeddings", [])
        arr = np.array(embeddings)
        if is_single and arr.ndim > 1 and len(arr) > 0:
            return arr[0]
        return arr


def get_embedding_model() -> SentenceTransformer | ModalEmbeddingAdapter:
    """
    Trả về embedding model singleton.
    Ưu tiên Modal endpoint nếu MODAL_EMBEDDING_URL được cấu hình.
    """
    global _embedding_model
    if _embedding_model is None:
        if settings.MODAL_EMBEDDING_URL:
            logger.info(
                "[EmbeddingModel] Using Modal endpoint: %s",
                settings.MODAL_EMBEDDING_URL,
            )
            _embedding_model = ModalEmbeddingAdapter(settings.MODAL_EMBEDDING_URL)
        else:
            local_model_path = settings.EMBEDDING_MODEL_PATH
            logger.info(
                "[EmbeddingModel] Loading SentenceTransformer from %s",
                local_model_path,
            )
            _embedding_model = SentenceTransformer(
                str(local_model_path),
                local_files_only=True,
            )
            logger.info("[EmbeddingModel] Model loaded successfully.")
    return _embedding_model
