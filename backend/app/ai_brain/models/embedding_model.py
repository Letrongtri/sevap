"""
Shared SentenceTransformer singleton.

Load model một lần duy nhất khi module được import lần đầu.
DocumentEmbedder dùng chung instance này cho cả hai path:
  - embed()        : document ingestion (async)
  - encode_query() : query encoding cho retrieval (sync)
Tránh lãng phí RAM (~1-2 GB mỗi lần load thêm instance).
"""

from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.core.logging import logger

_embedding_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """
    Trả về singleton SentenceTransformer.
    Lazy-init: chỉ load khi lần đầu được gọi.
    """
    global _embedding_model
    if _embedding_model is None:
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
