from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_brain.retrieval import PARContext
from app.ai_brain.agents.policy_agent import PolicyAgent

class IntentRouter:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def route(self, query: str, par_context: PARContext) -> dict:
        # V1: always route to Policy Agent
        agent = PolicyAgent(self.db)
        return await agent.run(query=query, par_context=par_context)
