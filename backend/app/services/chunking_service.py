from typing import List, Union
from pathlib import Path

from langchain_core.documents import Document
from transformers import AutoTokenizer
from sentence_transformers import SentenceTransformer

from docling.document_converter import DocumentConverter
from docling.chunking import HybridChunker, BaseChunk
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer

from app.core.config import settings

class ChunkService:
    def __init__(self):
        self.tokenizer_name = settings.TOKENIZER_NAME
        self.embedding_model_name = settings.EMBEDDING_MODEL
        self.embedding_model_dimension = settings.EMBEDDING_MODEL_DIMENSION
        self.chunk_size = settings.EMBEDDING_CHUNK_SIZE
        self.chunk_overlap = settings.EMBEDDING_CHUNK_OVERLAP
        self.batch_size = settings.EMBEDDING_BATCH_SIZE

        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        local_model_path = BASE_DIR / "data" / "models" / "bge-m3"

        self.tokenizer = AutoTokenizer.from_pretrained(
            str(local_model_path),
            local_files_only=True
        )
        self.embedding_model = SentenceTransformer(
            str(local_model_path),
            local_files_only=True
        )
        self.chunker = HybridChunker(
            tokenizer=self.tokenizer, 
            merge_peers=True,
            max_tokens=self.chunk_size
        )
    
    async def hybrid_chunking(self, doc_path: str) -> List[Document]:
        doc = DocumentConverter().convert(source=doc_path).document
        chunk_iter = self.chunker.chunk(dl_doc=doc)
        chunks = list(chunk_iter)
        return chunks
    
    async def get_chunk_context(self, chunk: BaseChunk):
        return self.chunker.contextualize(chunk=chunk)

    async def embedding_chunking(self, chunk: BaseChunk) -> List[float]:
        contents = self.chunker.contextualize(chunk=chunk)
        embeddings = self.embedding_model.encode(
            contents,
            batch_size=self.batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        return embeddings.tolist()

    