from langchain_core.messages import AIMessage, HumanMessage
from app.ai_brain.state import AgentState
from app.core.enum import GraphNodeID

async def fallback_node(state: AgentState) -> dict:
    question = state["original_question"]
    
    answer = (
        "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn "
        "trong tài liệu nội bộ hiện có. Bạn có thể thử:\n"
        "• Đặt câu hỏi cụ thể hơn (ví dụ: đề cập rõ loại chính sách, phòng ban)\n"
        "• Liên hệ trực tiếp phòng Nhân sự để được hỗ trợ thêm"
    )
    return {
        "final_answer": answer,
        "sources": [],
        "messages": [
            HumanMessage(content=question), 
            AIMessage(content=answer)
        ],
        "_next": GraphNodeID.END.value,
    }
