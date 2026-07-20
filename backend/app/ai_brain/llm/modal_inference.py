"""
modal_inference.py
──────────────────
Modal.com Serverless Inference — Embedding + Reranker gộp trong 1 App/GPU T4.

  EmbeddingService  → POST /embed   (BAAI/bge-m3)
  RerankerService   → POST /rerank  (BAAI/bge-reranker-v2-m3)

Deploy:
    modal deploy app/ai_brain/llm/modal_inference.py
"""

import modal
from modal import Image, Volume
from pydantic import BaseModel

APP_NAME = "hr-assistant-inference"
MODELS_DIR = "/models"
EMBEDDING_MODEL_ID = "BAAI/bge-m3"
RERANKER_MODEL_ID = "BAAI/bge-reranker-v2-m3"

# Volume dùng chung cho cả 2 model
model_volume = Volume.from_name("hr-assistant-inference-models", create_if_missing=True)

# Container Image với môi trường Python 3.11 sạch và các thư viện mới nhất tương thích
inference_image = (
    Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch>=2.6.0",
        "sentence-transformers>=3.3.0",
        "transformers>=4.48.0",
        "accelerate",
        "fastapi[standard]",
        "numpy",
    )
)

app = modal.App(name=APP_NAME)


# ── Schemas ───────────────────────────────────────────────────────────────────
class EmbedRequest(BaseModel):
    texts: list[str]
    normalize: bool = True


class RerankRequest(BaseModel):
    pairs: list[list[str]]  # [[query, passage], ...]


# ── Embedding Service (bge-m3) ────────────────────────────────────────────────
@app.cls(
    image=inference_image,
    gpu="t4",
    volumes={MODELS_DIR: model_volume},
    scaledown_window=300,
    timeout=300,
)
class EmbeddingService:

    @modal.enter()
    def load(self):
        import os
        from sentence_transformers import SentenceTransformer

        # Đặt cache dir về Volume để tái sử dụng giữa các lần
        os.environ["HF_HOME"] = MODELS_DIR
        os.environ["SENTENCE_TRANSFORMERS_HOME"] = MODELS_DIR

        print(f"[Embedding] Loading {EMBEDDING_MODEL_ID}...")
        self.model = SentenceTransformer(EMBEDDING_MODEL_ID)
        # Commit về Volume sau lần download đầu tiên
        model_volume.commit()
        print(f"[Embedding] Ready.")

    @modal.fastapi_endpoint(method="POST", label="embed")
    def embed(self, request: EmbedRequest):
        embeddings = self.model.encode(
            request.texts,
            normalize_embeddings=request.normalize,
            show_progress_bar=False,
        )
        return {"embeddings": embeddings.tolist()}


# ── Reranker Service (bge-reranker-v2-m3) ────────────────────────────────────
@app.cls(
    image=inference_image,
    gpu="t4",
    volumes={MODELS_DIR: model_volume},
    scaledown_window=300,
    timeout=300,
)
class RerankerService:

    @modal.enter()
    def load(self):
        import os
        from sentence_transformers import CrossEncoder

        os.environ["HF_HOME"] = MODELS_DIR
        os.environ["SENTENCE_TRANSFORMERS_HOME"] = MODELS_DIR

        print(f"[Reranker] Loading {RERANKER_MODEL_ID}...")
        self.model = CrossEncoder(RERANKER_MODEL_ID)
        model_volume.commit()
        print(f"[Reranker] Ready.")

    @modal.fastapi_endpoint(method="POST", label="rerank")
    def rerank(self, request: RerankRequest):
        scores = self.model.predict(
            [tuple(p) for p in request.pairs],
            show_progress_bar=False,
        )
        return {"scores": scores.tolist()}
