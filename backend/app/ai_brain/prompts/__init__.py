from app.ai_brain.prompts.intent_router_prompt import (
    INTENT_ROUTER_SYSTEM_PROMPT,
    INTENT_ROUTER_USER_PROMPT,
)
from app.ai_brain.prompts.direct_response_generator_prompt import (
    DIRECT_RESPONSE_GENERATOR_SYSTEM_PROMPT,
    DIRECT_RESPONSE_GENERATOR_USER_PROMPT,
)
from app.ai_brain.prompts.generate_response_prompt import (
    GENERATE_RESPONSE_SYSTEM_PROMPT,
    GENERATE_RESPONSE_USER_PROMPT,
)
from app.ai_brain.prompts.rewrite_query_prompt import (
    # Full rewrite (toàn bộ câu hỏi gốc + sub-queries)
    REWRITE_QUERY_FULL_SYSTEM_PROMPT,
    REWRITE_QUERY_FULL_USER_PROMPT,
    # Partial rewrite (chỉ reformulate các sub-query thất bại)
    REWRITE_QUERY_PARTIAL_SYSTEM_PROMPT,
    REWRITE_QUERY_PARTIAL_USER_PROMPT,
)
from app.ai_brain.prompts.context_aware_rewrite_prompt import (
    CONTEXT_AWARE_REWRITE_SYSTEM_PROMPT,
    CONTEXT_AWARE_REWRITE_USER_PROMPT,
)

__all__ = [
    "INTENT_ROUTER_SYSTEM_PROMPT",
    "INTENT_ROUTER_USER_PROMPT",
    "DIRECT_RESPONSE_GENERATOR_SYSTEM_PROMPT",
    "DIRECT_RESPONSE_GENERATOR_USER_PROMPT",
    "GENERATE_RESPONSE_SYSTEM_PROMPT",
    "GENERATE_RESPONSE_USER_PROMPT",
    "REWRITE_QUERY_FULL_SYSTEM_PROMPT",
    "REWRITE_QUERY_FULL_USER_PROMPT",
    "REWRITE_QUERY_PARTIAL_SYSTEM_PROMPT",
    "REWRITE_QUERY_PARTIAL_USER_PROMPT",
    "CONTEXT_AWARE_REWRITE_SYSTEM_PROMPT",
    "CONTEXT_AWARE_REWRITE_USER_PROMPT",
]
