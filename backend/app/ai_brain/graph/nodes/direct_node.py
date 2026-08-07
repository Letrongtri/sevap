from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    DIRECT_RESPONSE_GENERATOR_SYSTEM_PROMPT,
    DIRECT_RESPONSE_GENERATOR_USER_PROMPT,
)
from app.ai_brain.prompts.prompt_resolver import get_prompt
from app.ai_brain.state import AgentState
from app.core.config import settings
from app.core.enum import GraphNodeID, PromptType

async def direct_node(state: AgentState, config: RunnableConfig) -> dict:
    question = state["original_question"]
    chat_history = config["configurable"].get("chat_history", [])
    
    model_name = settings.OLLAMA_SLM_MODEL
    llm = get_llm(model_name=model_name, temperature=0.6)

    history_context = "\n".join([
        f"{msg.actor}: {msg.content}" 
        for msg in chat_history
    ]) if chat_history else "No previous conversation history."

    # Lấy prompt values từ state (custom tenant) hoặc fallback về default
    system_prompt = DIRECT_RESPONSE_GENERATOR_SYSTEM_PROMPT.format(
        assistant_name=get_prompt(state, PromptType.ASSISTANT_NAME),
        assistant_capabilities=get_prompt(state, PromptType.ASSISTANT_CAPABILITIES),
        response_behavioral=get_prompt(state, PromptType.RESPONSE_BEHAVIORAL),
        language=get_prompt(state, PromptType.LANGUAGE),
        response_tone=get_prompt(state, PromptType.RESPONSE_TONE),
        response_formatting=get_prompt(state, PromptType.RESPONSE_FORMATTING),
    )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=DIRECT_RESPONSE_GENERATOR_USER_PROMPT.format(
            history=history_context,
            question=question
        )),
    ]
    
    response = await llm.ainvoke(messages)
    answer = response.content.strip()
    
    return {
        "final_answer": answer,
        "sources": [],
        "messages": [HumanMessage(content=question), AIMessage(content=answer)],
        "_next": GraphNodeID.END.value,
    }
