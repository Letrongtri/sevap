from typing import List

from app.ai_brain.models import get_embedding_model
from app.core.config import settings
from app.core.logging import logger

class DocumentEmbedder:
    def __init__(self):
        self.embedding_model_name = settings.EMBEDDING_MODEL
        self.embedding_model_dimension = settings.EMBEDDING_MODEL_DIMENSION
        self.batch_size = settings.EMBEDDING_BATCH_SIZE
        self.embedding_model = get_embedding_model()

    def encode_query(self, query: str) -> List[float]:
        """
        Chuyển query text thành vector embedding chuẩn hóa (synchronous).

        Dùng cho retrieval path — gọi trực tiếp trong async context vì
        SentenceTransformer inference là CPU-bound và không block event loop
        đủ lâu để cần asyncio.to_thread().
        """
        embedding = self.embedding_model.encode(
            query,
            normalize_embeddings=True,
        )
        return embedding.tolist()

    async def embed(self, contextual_text: str) -> List[float]:
        """
        Chuyển đổi văn bản được làm giàu ngữ cảnh sang vector embedding để tìm kiếm ngữ nghĩa.
        Dùng cho document ingestion pipeline (async context).
        """
        try:
            embeddings = self.embedding_model.encode(
                contextual_text,
                batch_size=self.batch_size,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )

            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Lỗi chuyển đổi sang vector embedding: {str(e)}", exc_info=True)
            raise

document_embedder = DocumentEmbedder()
