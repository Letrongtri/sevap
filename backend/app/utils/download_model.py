from huggingface_hub import snapshot_download
import os
from pathlib import Path

from app.core.logging import logger

def download_model(repo_model: str):
    """
    download model từ huggingface vào thư mục models của dự án
    """
    model_name = repo_model.split("/")[-1]
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    MODEL_DIR = BASE_DIR / "data" / "models" / model_name
    os.makedirs(MODEL_DIR, exist_ok=True)

    logger.info(f"Installing {model_name} model...")
    snapshot_download(
        repo_id=repo_model, 
        local_dir=MODEL_DIR,
        local_dir_use_symlinks=False # Tải file thực tế, không dùng symlink
    )
    logger.info(f"{model_name} model installed at {MODEL_DIR}")

if __name__ == "__main__":
    download_model("BAAI/bge-m3")
    download_model("BAAI/bge-reranker-v2-m3")
