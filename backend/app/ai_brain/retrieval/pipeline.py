# Adaptive Retrieval Pineline (Keyword, semantic, Multi-hop)

from sentence_transformers import SentenceTransformer

from app.core.config import settings

class RetrievalPipeline:
    def __init__(self):
        local_model_path = settings.EMBEDDING_MODEL_PATH

        self.embedding_model = SentenceTransformer(
            str(local_model_path),
            local_files_only=True
        )

    def encode_query(self, query: str) -> list[float]:
        embedding = (
            self.embedding_model.encode(query, normalize_embeddings=True)
        )
        return embedding.tolist()
    
    def rerank(self, query: str, results: list[dict]) -> list[dict]:
        # TODO: Cài đặt Adaptive / Reranking 
        return results
