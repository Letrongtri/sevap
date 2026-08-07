from langchain_core.messages import AIMessage, HumanMessage
from app.ai_brain.prompts.prompt_resolver import get_prompt
from app.ai_brain.state import AgentState
from app.core.enum import GraphNodeID, PromptType

async def fallback_node(state: AgentState) -> dict:
    question = state["original_question"]

    # Lấy nội dung fallback từ state (custom tenant) hoặc default
    answer = get_prompt(state, PromptType.FALLBACK_RESPONSE)

    return {
        "final_answer": answer,
        "sources": [],
        "messages": [
            HumanMessage(content=question),
            AIMessage(content=answer)
        ],
        "_next": GraphNodeID.END.value,
    }
