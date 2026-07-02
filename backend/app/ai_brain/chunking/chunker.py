from typing import List, Any
from pathlib import Path

from langchain_core.documents import Document
from transformers import AutoTokenizer

from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption
from docling.chunking import HybridChunker, BaseChunk
from docling.datamodel.pipeline_options import PipelineOptions, PdfPipelineOptions, RapidOcrOptions
from docling.datamodel.base_models import InputFormat

from app.core.config import settings
from app.core.logging import logger

class DocumentChunker:
    def __init__(self):        
        self.chunk_size = settings.EMBEDDING_CHUNK_SIZE
        self.chunk_overlap = settings.EMBEDDING_CHUNK_OVERLAP
        self.allowed_upload_extensions = settings.ALLOWED_UPLOAD_EXTENSIONS

        local_model_path = settings.EMBEDDING_MODEL_PATH

        self.tokenizer = AutoTokenizer.from_pretrained(
            str(local_model_path),
            local_files_only=True
        )

        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True
        pipeline_options.ocr_options = RapidOcrOptions(lang=["vi", "en"])

        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
                InputFormat.DOCX: WordFormatOption()
            }
        )

        self.chunker = HybridChunker(
            tokenizer=self.tokenizer, 
            merge_peers=True,
            max_tokens=self.chunk_size
        )

    async def convert_to_chunks(self, doc_path: str) -> List[Any]:
        """
        Tiến hành đọc tệp đa định dạng, bóc tách và băm nhỏ thành các Chunks.
        """
        try:
            # Kiểm tra định dạng tệp hợp lệ trước khi đẩy vào pipeline
            ext = Path(doc_path).suffix.lower()
            if ext not in self.allowed_upload_extensions:
                logger.warning(
                    f"Định dạng tệp {ext} chưa được hỗ trợ, chuyển tiếp sang pipeline mặc định của Docling."
                )

            # Trích xuất văn bản có cấu trúc từ file
            converted_doc = self.converter.convert(source=doc_path).document
            
            # Phân đoạn mảnh dựa trên cấu trúc tài liệu (Headers, Paragraphs, Tables)
            chunk_iter = self.chunker.chunk(dl_doc=converted_doc)
            return list(chunk_iter)
        except Exception as e:
            logger.error(f"Lỗi phân mảnh tài liệu đa định dạng tại {doc_path}: {str(e)}", exc_info=True)
            raise
    
    async def get_chunk_context(self, chunk: BaseChunk):
        return self.chunker.contextualize(chunk=chunk)

    async def chunking_to_documents(self, doc_path: str) -> List[Document]:
        chunk_iter = await self.convert_to_chunks(doc_path=doc_path)
        doc_list = []
        for chunk in chunk_iter:
            chunk_text = self.chunker.serialize(chunk)
            metadata = {
                "source": doc_path,
                "page_number": [page.page_no for page in chunk.meta.doc_items if hasattr(page, "page_no")] or None,
                "headings": chunk.meta.headings if hasattr(chunk.meta, "headings") else []
            }
            
            doc_list.append(
                Document(
                    page_content=chunk_text,
                    metadata=metadata
                )
            )
        return doc_list

document_chunker = DocumentChunker()