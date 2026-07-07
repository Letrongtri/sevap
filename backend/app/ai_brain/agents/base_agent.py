from abc import ABC, abstractmethod
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_brain.schemas import PARContext

class BaseAgent(ABC):
    def __init__(self, db: AsyncSession):
        self.db = db

    @abstractmethod
    async def run(self, query: str, par_context: PARContext) -> dict:
        """
        Returns:
            {
                "answer": str,
                "sources": list[dict],   # chunk metadata for explainability
                "agent_type": str,
                "confidence": float | None
            }
        """
        ...