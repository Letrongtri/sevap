from langchain_core.messages import SystemMessage, HumanMessage

from app.ai_brain.agents.base_agent import BaseAgent
from app.ai_brain.retrieval import RetrievalService, PARContext, PARRepository, RetrievalPipeline
from app.ai_brain.llm.llm_provider import get_llm
from app.ai_brain.prompts.policy_prompt import POLICY_SYSTEM_PROMPT, POLICY_USER_PROMPT

class PolicyAgent(BaseAgent):

    async def run(self, query: str, par_context: PARContext) -> dict:
        # 1. Retrieve relevant chunks (PAR-filtered)
        repo = PARRepository(self.db)
        pipeline = RetrievalPipeline()
        retrieval_service = RetrievalService(repo, pipeline)
        chunks = await retrieval_service.retrieve(
            query=query,
            par_context=par_context,
            top_k=5
        )

        if not chunks:
            return {
                "answer": "I could not find any relevant policy documents for your query.",
                "sources": [],
                "agent_type": "policy_agent",
                "confidence": None,
            }

        # 2. Build context string
        context = "\n\n---\n\n".join(
            f"[Source: {getattr(c, 'doc_title', 'Unknown')}]\n{c.content}"
            for c in chunks
        )

        # 3. Call LLM
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
            "sources": [{"title": getattr(c, "doc_title", "Unknown"), "chunk_id": getattr(c, "chunk_id", None)} for c in chunks],
            "agent_type": "policy_agent",
            "confidence": None,
        }