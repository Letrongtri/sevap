# Adaptive Retrieval Pineline (Keyword, semantic, Multi-hop)

from sentence_transformers import SentenceTransformer

from app.core.config import settings

class RetrievalPipeline:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RetrievalPipeline, cls).__new__(cls)
            local_model_path = settings.EMBEDDING_MODEL_PATH
            cls._instance.embedding_model = SentenceTransformer(
                str(local_model_path),
                local_files_only=True
            )
        return cls._instance

    def __init__(self):
        pass

    def encode_query(self, query: str) -> list[float]:
        embedding = (
            self.embedding_model.encode(query, normalize_embeddings=True)
        )
        return embedding.tolist()
    
    def rerank(self, query: str, results: list) -> list:
        """
        Reranking placeholder — hiện tại trả về nguyên kết quả (pass-through).
        Có thể implement CrossEncoder sau nếu cần độ chính xác cao hơn.
        """
        return results

