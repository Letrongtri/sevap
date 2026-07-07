from langchain_ollama import ChatOllama
from app.core.config import settings

def get_llm(
    model_name: str = settings.OLLAMA_MODEL,
    base_url: str = settings.OLLAMA_BASE_URL,
    temperature: float = 0.0,
    format_json: bool = False
) -> ChatOllama:
    return ChatOllama(
        model=model_name,
        base_url=base_url,
        temperature=temperature,
        format= "json" if format_json else None,
    )
