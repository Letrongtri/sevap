from langchain_ollama import ChatOllama
from app.core.config import settings

def get_llm(temperature: float = 0.0) -> ChatOllama:
    return ChatOllama(
        model=settings.OLLAMA_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=temperature,
    )
