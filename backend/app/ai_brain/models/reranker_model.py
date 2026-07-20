"""
reranker_model.py
─────────────────
Singleton CrossEncoder hoặc Modal HTTP adapter.

Nếu MODAL_RERANKER_URL được set → gọi Modal GPU endpoint.
Ngược lại → load model local như cũ (fallback).
"""

import numpy as np
from sentence_transformers import CrossEncoder

from app.core.config import settings
from app.core.logging import logger

_reranker_model = None


class ModalRerankerAdapter:
    """
    Drop-in replacement cho CrossEncoder.
    Gọi Modal HTTP endpoint thay vì chạy model local.
    Interface tương thích: .predict(pairs) → np.ndarray
    """

    def __init__(self, url: str):
        self.url = url
        import httpx
        self._client = httpx.Client(timeout=60.0)

    def predict(self, pairs, show_progress_bar: bool = False, **kwargs) -> np.ndarray:
        # pairs có thể là list of tuples hoặc list of lists
        pairs_list = [list(p) for p in pairs]
        response = self._client.post(
            self.url,
            json={"pairs": pairs_list},
        )
        response.raise_for_status()
        return np.array(response.json()["scores"])


def get_reranker_model() -> CrossEncoder | ModalRerankerAdapter:
    """
    Trả về reranker model singleton.
    Ưu tiên Modal endpoint nếu MODAL_RERANKER_URL được cấu hình.
    """
    global _reranker_model
    if _reranker_model is None:
        if settings.MODAL_RERANKER_URL:
            logger.info(
                "[RerankerModel] Using Modal endpoint: %s",
                settings.MODAL_RERANKER_URL,
            )
            _reranker_model = ModalRerankerAdapter(settings.MODAL_RERANKER_URL)
        else:
            local_model_path = settings.RERANKER_MODEL_PATH
            logger.info(
                "[RerankerModel] Loading CrossEncoder from %s",
                local_model_path,
            )
            _reranker_model = CrossEncoder(
                str(local_model_path),
                local_files_only=True,
            )
            logger.info("[RerankerModel] Model loaded successfully.")
    return _reranker_model
