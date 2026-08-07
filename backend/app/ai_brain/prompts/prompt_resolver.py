"""
prompt_resolver.py
──────────────────
Helper để lấy giá trị prompt từ AgentState với fallback về default_prompts.

Cách dùng trong node:
    from app.ai_brain.prompts.prompt_resolver import get_prompt
    from app.core.enum import PromptType

    name = get_prompt(state, PromptType.ASSISTANT_NAME)
"""

from app.core.enum import PromptType
from app.ai_brain.prompts.default_prompts import prompt_map as _default_map


def get_prompt(state: dict, prompt_type: PromptType) -> str:
    """
    Tra cứu prompt value theo thứ tự ưu tiên:
      1. state["prompt_templates"][prompt_type.value]  — custom của tenant
      2. default_prompts.prompt_map[prompt_type]       — fallback mặc định

    Args:
        state: AgentState dict (hoặc bất kỳ dict nào có key "prompt_templates")
        prompt_type: PromptType enum value cần lấy

    Returns:
        str — nội dung prompt (không bao giờ None)
    """
    tenant_templates: dict[str, str] = state.get("prompt_templates") or {}
    custom_value = tenant_templates.get(prompt_type.value)
    if custom_value:
        return custom_value
    return _default_map.get(prompt_type, "")
