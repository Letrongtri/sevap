from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from langgraph.graph.state import CompiledStateGraph

from app.ai_brain.retrieval import PARRepository, RetrievalService
from app.dependencies.db import get_db
from app.dependencies.graph import get_compiled_graph
from app.repositories import ConversationRepository, MessageRepository
from app.services import MessageService


def get_message_service(
        db: AsyncSession = Depends(get_db),
        compiled_graph: CompiledStateGraph = Depends(get_compiled_graph),
) -> MessageService:
    msg_repo = MessageRepository(db)
    conv_repo = ConversationRepository(db)
    par_repo = PARRepository(db)
    retrieval_service = RetrievalService(repo=par_repo)
    return MessageService(
        msg_repo=msg_repo,
        conv_repo=conv_repo,
        par_repo=par_repo,
        retrieval_service=retrieval_service,
        compiled_graph=compiled_graph,
    )