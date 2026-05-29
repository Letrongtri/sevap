from huggingface_hub import snapshot_download
import os
from pathlib import Path

from app.core.logging import logger

# Tạo thư mục để chứa 
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "data" / "models" / "bge-m3"

os.makedirs(MODEL_DIR, exist_ok=True)

logger.info("Installing BGE-M3 model...")
snapshot_download(
    repo_id="BAAI/bge-m3", 
    local_dir=MODEL_DIR,
    local_dir_use_symlinks=False # Tải file thực tế, không dùng symlink
)
logger.info(f"BGE-M3 model installed at {MODEL_DIR}")