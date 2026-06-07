from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_brain.retrieval import PARContext
from app.ai_brain.agents.policy_agent import PolicyAgent


class IntentRouter:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def route(self, query: str, par_context: PARContext) -> dict:
        """Non-streaming: returns full result dict."""
        # V1: always route to Policy Agent
        agent = PolicyAgent(self.db)
        return await agent.run(query=query, par_context=par_context)

    async def route_stream(
        self, query: str, par_context: PARContext
    ) -> AsyncGenerator[dict, None]:
        """Streaming: yields token/done/error dicts from the selected agent."""
        # V1: always route to Policy Agent
        agent = PolicyAgent(self.db)
        async for event in agent.stream(query=query, par_context=par_context):
            yield event
