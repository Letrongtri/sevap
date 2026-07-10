from sentence_transformers import CrossEncoder

from app.core.config import settings
from app.core.logging import logger

_reranker_model: CrossEncoder | None = None


# ─────────────────────────────────────────────────────────────────────────────
# Singleton CrossEncoder — load một lần duy nhất khi module được import
# ─────────────────────────────────────────────────────────────────────────────

def get_reranker_model() -> CrossEncoder:
    """
    Trả về singleton CrossEncoder.
    Lazy-init: chỉ load khi lần đầu được gọi.
    """
    global _reranker_model
    if _reranker_model is None:
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
