from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from app.ai_brain.llm import get_llm
from app.ai_brain.prompts import (
    GENERATE_RESPONSE_SYSTEM_PROMPT,
    GENERATE_RESPONSE_USER_PROMPT,
)
from app.ai_brain.state import AgentState
from app.core.enum import GraphNodeID

async def generate_final_response_node(state: AgentState, config: RunnableConfig) -> dict:
    question = state["rewritten_question"]
    chunks = state.get("reranked_chunks") or state.get("retrieved_chunks", [])
    chat_history = config["configurable"].get("chat_history", [])
    
    llm = get_llm(temperature=0.6)

    history_context = "\n".join([
        f"{msg.actor}: {msg.content}" 
        for msg in chat_history
    ]) if chat_history else "No previous conversation history."
    

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(
            f"[Document {i}: {chunk['doc_title']}]\n{chunk['content']}"
        )
    context_text = "\n\n---\n\n".join(context_parts)

    messages = [
        SystemMessage(content=GENERATE_RESPONSE_SYSTEM_PROMPT),
        HumanMessage(content=GENERATE_RESPONSE_USER_PROMPT.format(
            history=history_context,
            context=context_text,
            query=question
        )),
    ]
    
    response = await llm.ainvoke(messages)
    answer = response.content.strip()

    sources = [
        {
            "chunk_id": c['chunk_id'],
            "document_id": c['document_id'],
            "doc_title": c['doc_title'],
            "content": c['content'],
            "score": c['score'],
        }
        for c in chunks
    ]

    original_question = state["original_question"]
    
    return {
        "final_answer": answer,
        "sources": sources,
        "messages": [
            HumanMessage(content=original_question), 
            AIMessage(content=answer)
        ],
        "_next": GraphNodeID.END.value,
    }
