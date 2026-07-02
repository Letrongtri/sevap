from typing import List

from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.core.logging import logger

class DocumentEmbedder:
    def __init__(self):
        self.embedding_model_name = settings.EMBEDDING_MODEL
        self.embedding_model_dimension = settings.EMBEDDING_MODEL_DIMENSION
        self.batch_size = settings.EMBEDDING_BATCH_SIZE

        local_model_path = settings.EMBEDDING_MODEL_PATH

        self.embedding_model = SentenceTransformer(
            str(local_model_path),
            local_files_only=True
        )
    
    async def embed(self, contextual_text: str) -> List[float]:
        """
        Chuyển đổi văn bản được làm giàu ngữ cảnh sang vector embedding để tìm kiếm ngữ nghĩa.
        """
        try:
            embeddings = self.embedding_model.encode(
                contextual_text,
                batch_size=self.batch_size,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False
            )

            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Lỗi chuyển đổi sang vector embedding: {str(e)}", exc_info=True)
            raise

document_embedder = DocumentEmbedder()
