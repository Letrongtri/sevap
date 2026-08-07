from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from app.ai_brain.prompts.prompt_resolver import get_prompt
from app.ai_brain.state import AgentState
from app.core.enum import PromptType
from app.core.logging import logger


async def security_kill_switch_node(state: AgentState, config: RunnableConfig) -> dict:
    """
    Terminal node xử lý các trường hợp Security Anomaly.

    Được kích hoạt khi:
      - intent_node phát hiện Prompt Injection / Cross-tenant attack (Tier-1 LLM)
      - rewrite_node phát hiện tấn công trong retry loop
    """
    original_question = state.get("original_question", "")
    reasoning = state.get("router_reasoning", "Malicious input detected.")

    # user_security_ctx lấy từ configurable (không persist trong state)
    security_ctx = config["configurable"].get("user_security_ctx")
    tenant_id = getattr(security_ctx, "tenant_id", None) if security_ctx else None

    logger.warning(
        "[SecurityKillSwitch] TERMINATED | query=%r | reason=%r | tenant=%r",
        original_question,
        reasoning,
        tenant_id,
    )

    # Lấy nội dung response từ state (custom tenant) hoặc default
    answer = get_prompt(state, PromptType.SECURITY_KILL_SWITCH_RESPONSE)

    return {
        "final_answer": answer,
        "sources": [],
        "messages": [
            HumanMessage(content=original_question),
            AIMessage(content=answer),
        ],
    }
