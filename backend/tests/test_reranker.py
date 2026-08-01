
import math
from app.ai_brain.models import get_reranker_model

def _sigmoid(x: float) -> float:
    """Normalize CrossEncoder raw logit sang xác suất [0, 1]."""
    return 1.0 / (1.0 + math.exp(-x))

def reranker():
    reranker = get_reranker_model()
    pairs = [
    ("Thủ đô của nước Pháp là gì?", "Paris là thủ đô của nước Pháp."),
    ("Thành phố lớn nhất nước Mỹ là gì?", "Hôm nay tôi cảm thấy rất vui vẻ và hào hứng"),
    ("Quốc gia nhỏ nhất thế giới là gì?", "Nga là quốc gia có diện tích lớn nhất thế giới."),
    ]
    raw_logits = reranker.predict(pairs, show_progress_bar=False).tolist()
    raw_scores: list[float] = [_sigmoid(s) for s in raw_logits]
    print(raw_scores)

if __name__ == "__main__":
    reranker()