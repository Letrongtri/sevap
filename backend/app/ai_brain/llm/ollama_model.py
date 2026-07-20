"""
ollama_model.py
───────────────
Modal.com Serverless Ollama Service chạy trên GPU T4.
Tương thích với Modal v1.x API.

Expose toàn bộ Ollama REST API (port 11434) như một web_server,
để LangChain ChatOllama có thể giao tiếp trực tiếp mà không cần wrapper.

Deploy:
    modal deploy app/ai_brain/llm/ollama_model.py

Sau khi deploy, lấy URL từ output và đặt vào .env:
    MODAL_OLLAMA_URL=https://<workspace>--hr-assistant-ollama-ollamaservice-serve.modal.run
"""

import os
import subprocess
import time

import modal
from modal import Image, Volume

# ── Định danh ứng dụng ────────────────────────────────────────────────────────
APP_NAME = "hr-assistant-ollama"

# ── Models sẽ được pre-pull vào Volume khi container khởi động lần đầu ───────
MODELS_TO_PULL = [
    "qwen3:8b",       # Model chính (generate / direct node)
    "qwen2.5:3b",     # Router model & SLM model
]

# ── Volume lưu trữ model weights (persistent, tránh download lại mỗi lần) ────
volume = Volume.from_name("hr-assistant-models", create_if_missing=True)

# ── Container Image: CUDA base + Ollama + httpx để health-check ───────────────
ollama_image = (
    Image.from_registry("nvidia/cuda:12.1.1-runtime-ubuntu22.04", add_python="3.11")
    .apt_install("curl", "ca-certificates", "zstd")
    .run_commands(
        # Cài Ollama (GPU không cần ở build-time, chỉ cần lúc runtime)
        "curl -fsSL https://ollama.com/install.sh | sh",
    )
    .pip_install("httpx")
)

app = modal.App(name=APP_NAME)


@app.cls(
    image=ollama_image,
    gpu="t4",
    volumes={"/root/.ollama": volume},
    # Container ngủ sau 10 phút không có request → tiết kiệm chi phí
    scaledown_window=600,
    # Timeout tối đa cho một request (model lớn có thể cần thêm thời gian)
    timeout=600,
)
class OllamaService:
    """
    Serverless Ollama service chạy trên GPU T4.

    Expose Ollama API thô trên port 11434 → LangChain ChatOllama
    có thể kết nối thẳng mà không cần bất kỳ adapter nào.
    """

    @modal.enter()
    def start_ollama(self):
        """
        Cold-start: khởi động Ollama daemon và đảm bảo port 11434 đã bind.
        Model pull được thực hiện ở background thread để không block startup.
        """
        import threading
        import httpx

        print("[Startup] Starting Ollama daemon on 0.0.0.0:11434...")
        self.ollama_proc = subprocess.Popen(
            ["ollama", "serve"],
            env={
                **os.environ,
                "OLLAMA_MODELS": "/root/.ollama/models",
                # Bắt buộc: Modal web_server proxy cần Ollama bind trên 0.0.0.0
                "OLLAMA_HOST": "0.0.0.0:11434",
            },
        )

        # Health-check: chờ Ollama bind port (tối đa 60s)
        start_time = time.time()
        while True:
            try:
                r = httpx.get("http://127.0.0.1:11434/api/tags", timeout=2)
                if r.status_code == 200:
                    elapsed = time.time() - start_time
                    existing = [m["name"] for m in r.json().get("models", [])]
                    print(f"[Startup] Ollama ready in {elapsed:.1f}s. Cached models: {existing}")
                    break
            except Exception:
                if time.time() - start_time > 60:
                    raise RuntimeError("[Startup] Timeout: Ollama did not start within 60s")
                time.sleep(1)

        # Pull model ở background thread để @modal.enter() trả về ngay,
        # không block web_server startup_timeout
        bg = threading.Thread(target=self._ensure_models_ready, daemon=True)
        bg.start()
        print("[Startup] Model pull started in background thread.")

    def _ensure_models_ready(self):
        """
        Đảm bảo tất cả model cần thiết đã có trong Volume.
        Chạy trong background thread sau khi Ollama đã bind port.
        Nếu chưa có → pull và commit vào Volume để lần sau không cần pull lại.
        """
        import httpx

        try:
            r = httpx.get("http://127.0.0.1:11434/api/tags", timeout=5)
            existing_names = [m["name"] for m in r.json().get("models", [])]
        except Exception:
            existing_names = []

        needs_commit = False
        for model in MODELS_TO_PULL:
            # Kiểm tra cả tên đầy đủ và tên ngắn (vd: "qwen3:8b" hoặc "qwen3")
            already_cached = any(
                model in name or name.startswith(model.split(":")[0])
                for name in existing_names
            )
            if not already_cached:
                print(f"[Setup] Pulling model: {model} (first time, may take a few minutes)...")
                env = {**os.environ, "OLLAMA_HOST": "0.0.0.0:11434"}
                result = subprocess.run(
                    ["ollama", "pull", model],
                    env=env,
                    capture_output=False,
                )
                if result.returncode == 0:
                    print(f"[Setup] Model ready: {model}")
                    needs_commit = True
                else:
                    print(f"[Setup] Warning: Failed to pull {model}")
            else:
                print(f"[Setup] Model already cached: {model}")

        if needs_commit:
            print("[Setup] Committing new models to Volume...")
            volume.commit()
            print("[Setup] Volume committed successfully.")


    @modal.exit()
    def stop_ollama(self):
        """Dừng Ollama daemon khi container shutdown."""
        if hasattr(self, "ollama_proc"):
            self.ollama_proc.terminate()
            print("[Shutdown] Ollama daemon stopped.")

    @modal.web_server(port=11434, startup_timeout=600)
    def serve(self):
        """
        Expose Ollama HTTP API (port 11434) ra public internet.
        URL này sẽ được dùng làm MODAL_OLLAMA_URL trong .env.

        Compatible với bất kỳ HTTP client nào gọi Ollama API:
          - LangChain ChatOllama
          - curl / httpx
          - Ollama Python SDK
        """
        # Ollama đã được khởi động trong start_ollama().
        # modal.web_server() sẽ forward traffic vào port 11434.
        pass