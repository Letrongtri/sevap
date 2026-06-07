from typing import AsyncGenerator

from langchain_core.messages import SystemMessage, HumanMessage

from app.ai_brain.agents.base_agent import BaseAgent
from app.ai_brain.retrieval import RetrievalService, PARContext, PARRepository, RetrievalPipeline
from app.ai_brain.llm.llm_provider import get_llm
from app.ai_brain.prompts.policy_prompt import POLICY_SYSTEM_PROMPT, POLICY_USER_PROMPT


class PolicyAgent(BaseAgent):

    async def _retrieve_and_build_context(self, query: str, par_context: PARContext):
        """Shared retrieval logic used by both run() and stream()."""
        repo = PARRepository(self.db)
        pipeline = RetrievalPipeline()
        retrieval_service = RetrievalService(repo, pipeline)
        chunks = await retrieval_service.retrieve(
            query=query,
            par_context=par_context,
            top_k=5
        )
        return chunks

    async def run(self, query: str, par_context: PARContext) -> dict:
        """Non-streaming execution — returns full answer dict."""
        chunks = await self._retrieve_and_build_context(query, par_context)

        if not chunks:
            return {
                "answer": "I could not find any relevant policy documents for your query.",
                "sources": [],
                "agent_type": "policy_agent",
                "confidence": None,
            }

        context = "\n\n---\n\n".join(
            f"[Source: {getattr(c, 'doc_title', 'Unknown')}]\n{c.content}"
            for c in chunks
        )

        llm = get_llm(temperature=0.0)
        messages = [
            SystemMessage(content=POLICY_SYSTEM_PROMPT),
            HumanMessage(content=POLICY_USER_PROMPT.format(
                context=context,
                question=query
            )),
        ]
        response = await llm.ainvoke(messages)

        return {
            "answer": response.content,
            "sources": [
                {"title": getattr(c, "doc_title", "Unknown"), "chunk_id": getattr(c, "chunk_id", None)}
                for c in chunks
            ],
            "agent_type": "policy_agent",
            "confidence": None,
        }

    async def stream(
        self, query: str, par_context: PARContext
    ) -> AsyncGenerator[dict, None]:
        """
        Streaming execution.

        Yields dicts:
          - {"type": "token",  "data": "<chunk text>"}
          - {"type": "done",   "sources": [...], "agent_type": "policy_agent"}
          - {"type": "error",  "message": "..."} on no-results
        """
        chunks = await self._retrieve_and_build_context(query, par_context)

        if not chunks:
            yield {
                "type": "error",
                "message": "I could not find any relevant policy documents for your query.",
            }
            return

        context = "\n\n---\n\n".join(
            f"[Source: {getattr(c, 'doc_title', 'Unknown')}]\n{c.content}"
            for c in chunks
        )

        llm = get_llm(temperature=0.0)
        messages = [
            SystemMessage(content=POLICY_SYSTEM_PROMPT),
            HumanMessage(content=POLICY_USER_PROMPT.format(
                context=context,
                question=query
            )),
        ]

        async for chunk in llm.astream(messages):
            token = getattr(chunk, "content", "")
            if token:
                yield {"type": "token", "data": token}

        yield {
            "type": "done",
            "sources": [
                {"title": getattr(c, "doc_title", "Unknown"), "chunk_id": getattr(c, "chunk_id", None)}
                for c in chunks
            ],
            "agent_type": "policy_agent",
        }