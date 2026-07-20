"""
llm_provider.py
───────────────
Factory function để tạo LLM instance.

Tự động chọn backend dựa trên biến môi trường:
  - LLM_BACKEND=local  → dùng OLLAMA_BASE_URL (Docker local)
  - LLM_BACKEND=modal  → dùng MODAL_OLLAMA_URL (GPU T4 trên Modal.com)

Nếu MODAL_OLLAMA_URL chưa được set mà LLM_BACKEND=modal,
sẽ fallback về OLLAMA_BASE_URL và log cảnh báo.
"""

from langchain_ollama import ChatOllama

from app.core.config import settings
from app.core.logging import logger


def _resolve_base_url(override_url: str | None = None) -> str:
    """
    Xác định base URL của Ollama server dựa trên cấu hình backend.

    Priority:
      1. override_url (nếu caller truyền vào tường minh)
      2. MODAL_OLLAMA_URL (nếu LLM_BACKEND=modal)
      3. OLLAMA_BASE_URL (fallback local)
    """
    # Caller tường minh chỉ định URL → dùng ngay
    if override_url:
        return override_url

    if settings.LLM_BACKEND == "modal":
        if settings.MODAL_OLLAMA_URL:
            return settings.MODAL_OLLAMA_URL
        else:
            logger.warning(
                "[LLM Provider] LLM_BACKEND=modal nhưng MODAL_OLLAMA_URL chưa được set. "
                "Fallback về OLLAMA_BASE_URL (local). "
                "Hãy chạy `modal deploy` và điền URL vào .env."
            )

    return settings.OLLAMA_BASE_URL


def get_llm(
    model_name: str = settings.OLLAMA_MODEL,
    base_url: str | None = None,
    temperature: float = 0.0,
    format_json: bool = False,
) -> ChatOllama:
    """
    Tạo một ChatOllama instance hướng đến backend đang được cấu hình.

    Args:
        model_name:   Tên model Ollama (ví dụ "qwen3:8b").
        base_url:     URL tường minh, nếu None sẽ auto-resolve theo LLM_BACKEND.
        temperature:  Nhiệt độ sampling.
        format_json:  Nếu True, ép model trả về JSON format.

    Returns:
        ChatOllama instance đã được cấu hình.
    """
    effective_url = _resolve_base_url(base_url)

    logger.debug(
        "[LLM Provider] backend=%s | url=%s | model=%s",
        settings.LLM_BACKEND,
        effective_url,
        model_name,
    )

    return ChatOllama(
        model=model_name,
        base_url=effective_url,
        temperature=temperature,
        format="json" if format_json else None,
    )
