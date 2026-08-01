import os
import socket
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

def _resolve_db_url(url_str: str) -> str:
    try:
        url = make_url(url_str)
        if url.host == "db":
            if os.name == 'nt' or not os.path.exists('/.dockerenv'):
                url = url._replace(host="localhost")
            else:
                try:
                    socket.gethostbyname("db")
                except socket.gaierror:
                    url = url._replace(host="localhost")
        return url.render_as_string(hide_password=False)
    except Exception:
        return url_str

DATABASE_URL = _resolve_db_url(settings.DATABASE_URL)
engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)