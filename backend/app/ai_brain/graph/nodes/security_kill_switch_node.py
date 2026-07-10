from langchain_core.messages import AIMessage, HumanMessage
from app.ai_brain.state import AgentState
from app.core.logging import logger


async def security_kill_switch_node(state: AgentState) -> dict:
    """
    Terminal node xử lý các trường hợp Security Anomaly.

    Được kích hoạt khi:
      - intent_node phát hiện Prompt Injection / Cross-tenant attack (Tier-1 LLM)
      - rewrite_node phát hiện tấn công trong retry loop
    """
    original_question = state.get("original_question", "")
    reasoning = state.get("router_reasoning", "Malicious input detected.")

    logger.warning(
        "[SecurityKillSwitch] TERMINATED | query=%r | reason=%r | tenant=%r",
        original_question,
        reasoning,
        state.get("user_security_ctx", {}).get("tenant_id", "unknown")
        if isinstance(state.get("user_security_ctx"), dict)
        else getattr(state.get("user_security_ctx"), "tenant_id", "unknown"),
    )

    answer = (
        "Yêu cầu của bạn không thể được xử lý do vi phạm chính sách bảo mật hệ thống. "
        "Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên."
    )

    return {
        "final_answer": answer,
        "sources": [],
        "messages": [
            HumanMessage(content=original_question),
            AIMessage(content=answer),
        ],
    }
