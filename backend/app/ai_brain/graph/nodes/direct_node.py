from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    DIRECT_RESPONSE_GENERATOR_SYSTEM_PROMPT,
    DIRECT_RESPONSE_GENERATOR_USER_PROMPT,
)
from app.ai_brain.state import AgentState
from app.core.config import settings
from app.core.enum import GraphNodeID

async def direct_node(state: AgentState) -> dict:
    question = state["original_question"]
    chat_history = state["chat_history"]
    
    model_name = settings.OLLAMA_SLM_MODEL
    llm = get_llm(model_name=model_name, temperature=0.6)

    history_context = "\n".join([
        f"{msg.actor}: {msg.content}" 
        for msg in chat_history
    ]) if chat_history else "No previous conversation history."
    
    messages = [
        SystemMessage(content=DIRECT_RESPONSE_GENERATOR_SYSTEM_PROMPT),
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
