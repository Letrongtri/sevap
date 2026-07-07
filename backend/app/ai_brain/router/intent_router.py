import json
import re
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.enum import IntentType, RetrievalExecutionPlan
from app.core.config import settings
from app.core.logging import logger
from app.models import Message
from app.ai_brain.prompts.intent_router_prompt import (
    INTENT_ROUTER_USER_PROMPT, INTENT_ROUTER_SYSTEM_PROMPT
)
from app.ai_brain.llm.llm_provider import get_llm
from app.ai_brain.schemas import RouterOutputSchema, SubQuery


class IntentRouter:
    def __init__(
        self, 
        base_url: str = settings.OLLAMA_BASE_URL,
        router_model_name: str = settings.OLLAMA_ROUTER_MODEL
    ):
        self.base_url = base_url
        self.router_model_name = router_model_name

    def _clean_and_extract_json(self, raw_text: str) -> str:
        """
        Defensive Pipeline to extract and clean JSON
        Removes Markdown ```json or XML tags.
        """
        if not raw_text:
            return "{}"
            
        cleaned = raw_text.strip()
        
        # Step 1: Extract content inside <json_output> tag if present (Priority 1)
        if "<json_output>" in cleaned and "</json_output>" in cleaned:
            try:
                cleaned = cleaned.split("<json_output>")[1].split("</json_output>")[0].strip()
            except Exception:
                pass

        # Step 2: Remove Markdown ```json ... ``` or ``` ... ``` (Priority 2)
        # Sử dụng Regex phi tham lam (Non-greedy match) để bóc tách lõi JSON
        markdown_pattern = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
        match = markdown_pattern.search(cleaned)
        if match:
            cleaned = match.group(1).strip()
        else:
            # Step 3: If regex doesn't match, try to find the first and last curly brace
            # Guard against model generating extra text at the beginning or end
            start_idx = cleaned.find('{')
            end_idx = cleaned.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                cleaned = cleaned[start_idx:end_idx + 1].strip()
                
        return cleaned

    async def route_intent(
        self, history_messages: list[Message], current_query: str, tenant_id: str
    ) -> RouterOutputSchema:
        """
        Analyze intent and rewrite query.
        Note: tenant_id is passed for security audit purposes to ensure no cross-context leakage.
        """
        try:
            history_context = "\n".join([
                f"{msg.actor}: {msg.content}" 
                for msg in history_messages
            ]) if history_messages else "No previous conversation history."

            llm = get_llm(
                model_name=self.router_model_name,
                base_url=self.base_url,
                temperature=0.0,
                format_json=True
            )
            
            messages = [
                SystemMessage(content=INTENT_ROUTER_SYSTEM_PROMPT),
                HumanMessage(content=INTENT_ROUTER_USER_PROMPT.format(
                    history_context=history_context,
                    current_query=current_query
                )),
            ]

            response = await llm.ainvoke(messages)
            logger.info(f"Response: {response}", extra={"tenant_id": tenant_id})

            raw_content = response.content.strip()

            # Clean and extract JSON using the robust pipeline
            clean_json_str = self._clean_and_extract_json(raw_content)
            
            response_dict = json.loads(clean_json_str)

            if response_dict.get("is_security_anomaly", False):
                return RouterOutputSchema(
                    original_query=current_query,
                    rewritten_query="SECURITY WARNING: Malicious input detected.",
                    intent_type=IntentType.SECURITY_ANOMALY, 
                    execution_plan=RetrievalExecutionPlan.UNKNOWN,
                    sub_queries=[],
                    reasoning="Phát hiện Prompt Injection hoặc leo thang đặc quyền."
                )

            raw_subs = response_dict.get("sub_queries", [])
            sub_queries_objs = [SubQuery(**q) for q in raw_subs]

            # 2. Xử lý logic Heuristic xác định Strategy & Cấu trúc Kế hoạch thực thi bằng Python Code
            if not sub_queries_objs or len(sub_queries_objs) == 1:
                # Trường hợp Single RAG
                sub_query = SubQuery(
                    id=1, 
                    query=sub_queries_objs[0].query, 
                    depends_on=[]
                )
                return RouterOutputSchema(
                    original_query=current_query,
                    rewritten_query=response_dict.get("rewritten_query", current_query),
                    intent_type=IntentType.SINGLE_RAG,
                    execution_plan=RetrievalExecutionPlan.PARALLEL,
                    sub_queries=[sub_query],
                    reasoning=response_dict.get("reasoning", "Mô hình phân tích thấy câu hỏi đơn lẻ, thực thi song song.")
                )

            # Trường hợp Multi RAG          
            # Xác định loại hình thực thi dựa trên số lượng Batch sinh ra
            has_dependencies = any(len(q.depends_on) > 0 for q in sub_queries_objs)
            if not has_dependencies:
                plan_type = RetrievalExecutionPlan.PARALLEL
                reasoning = response_dict.get("reasoning", "Toàn bộ các câu hỏi con độc lập hoàn toàn, thực thi song song 100%.")
            else:
                plan_type = RetrievalExecutionPlan.SEQUENTIAL
                reasoning = response_dict.get("reasoning", "Chuỗi xử lý tính toán tuần tự nghiêm ngặt.")

            return RouterOutputSchema(
                original_query=current_query,
                rewritten_query=response_dict.get("rewritten_query", current_query),
                intent_type=IntentType.MULTI_RAG,
                execution_plan=plan_type,
                sub_queries=sub_queries_objs,
                reasoning=reasoning,
            )
        except Exception as e:
            logger.error(f"Failed to route query: {str(e)}", extra={"tenant_id": tenant_id})
            return RouterOutputSchema(
                original_query=current_query,
                rewritten_query=current_query,
                intent_type=IntentType.UNKNOWN,
                execution_plan=RetrievalExecutionPlan.UNKNOWN,
                sub_queries=[],
                reasoning=str(e),
            )

        