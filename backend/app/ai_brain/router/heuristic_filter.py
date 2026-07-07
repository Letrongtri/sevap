import re
import time
from typing import Optional

from app.core.enum import IntentType
from app.core.logging import logger

from .heuristic_patterns import BUSINESS_KEYWORDS, CategorySpec, CATEGORY_SPECS, HeuristicResult

def _has_business_keyword(text: str) -> bool:
    """
    Kiểm tra xem câu hỏi có chứa từ khoá nghiệp vụ không.
    Nếu có → tuyệt đối không phân loại là 'direct'.

    Dùng simple substring match thay vì regex để tốc độ tối đa (~0.1ms).
    """
    text_lower = text.lower()
    return any(kw in text_lower for kw in BUSINESS_KEYWORDS)


# PRE-COMPILE — Thực hiện một lần lúc module được import

def _compile_all() -> list[CategorySpec]:
    """
    Pre-compile tất cả regex patterns với flags: IGNORECASE + UNICODE.
    Được gọi một lần duy nhất lúc module load.
    """
    _FLAGS = re.IGNORECASE | re.UNICODE
    compiled_specs: list[CategorySpec] = []

    for spec in CATEGORY_SPECS:
        for raw in spec.raw_patterns:
            try:
                spec.compiled.append(re.compile(raw, _FLAGS))
            except re.error as exc:
                logger.error(
                    "[HeuristicFilter] Pattern compile error | "
                    "category=%s | pattern=%r | error=%s",
                    spec.name, raw, exc
                )
        compiled_specs.append(spec)

    total = sum(len(s.compiled) for s in compiled_specs)
    logger.info(
        "[HeuristicFilter] Compiled %d patterns across %d categories.",
        total, len(compiled_specs)
    )
    return compiled_specs


# Singleton: compile ngay khi module import
_COMPILED_SPECS: list[CategorySpec] = _compile_all()


## NORMALIZER — Chuẩn hoá input trước khi match

# Ký tự dư thừa thường xuất hiện ở đầu/cuối (không phải dấu câu tiếng Việt)
_LEADING_TRAILING_JUNK = re.compile(r"^[\s\-_=~`|]+|[\s\-_=~`|]+$")
# Collapse nhiều khoảng trắng thành 1
_MULTI_SPACE = re.compile(r"\s{2,}")


def _normalize(text: str) -> str:
    """
    Chuẩn hoá text để tăng khả năng match pattern.
    Không strip dấu câu ở giữa vì tiếng Việt dùng dấu có nghĩa.
    """
    text = text.strip()
    text = _LEADING_TRAILING_JUNK.sub("", text)
    text = _MULTI_SPACE.sub(" ", text)
    return text


# PUBLIC API

def check_heuristic_intent(question: str) -> Optional[HeuristicResult]:
    """
    Tier-0 Heuristic Intent Filter — Entry Point chính.

    Trả về `HeuristicResult` nếu câu hỏi khớp một pattern "direct",
    trả về `None` nếu không xác định được → hệ thống đẩy lên Tier-1 LLM.

    Độ phức tạp thời gian: O(N×M) với N = số category, M = số pattern/category.
    Với ~120 patterns pre-compiled: latency mục tiêu < 2ms trên mọi phần cứng.

    Args:
        question: Câu hỏi gốc từ user (chưa normalize).

    Returns:
        HeuristicResult | None
    """
    t_start = time.perf_counter()
    original = question
    normalized = _normalize(question)

    # Guard 1: Câu rỗng
    if not normalized:
        return HeuristicResult(
            matched=True,
            intent=IntentType.DIRECT,
            category_code="C12",
            category_name="filler_noise",
            matched_pattern="<empty_input>",
            confidence=1.0,
            latency_ms=(time.perf_counter() - t_start) * 1000,
            original_input=original,
        )

    # Guard 2: Exclusion — chứa từ khoá nghiệp vụ
    # Ưu tiên tuyệt đối: nếu câu hỏi chứa bất kỳ từ khoá nghiệp vụ nào,
    # không bao giờ trả về "direct", bất kể pattern có khớp.
    if _has_business_keyword(normalized):
        return None

    # Guard 3: Độ dài tối đa
    # Câu hỏi > 120 ký tự gần như không bao giờ là "direct"
    # → skip toàn bộ pattern matching để tiết kiệm CPU
    if len(normalized) > 120:
        return None

    # Core: Pattern Matching
    for spec in _COMPILED_SPECS:
        for pattern in spec.compiled:
            if pattern.search(normalized):
                latency_ms = (time.perf_counter() - t_start) * 1000
                logger.debug(
                    "[HeuristicFilter] MATCH | category=%s(%s) | "
                    "pattern=%r | input=%r | latency=%.3fms",
                    spec.code, spec.name, pattern.pattern,
                    normalized[:60], latency_ms
                )
                return HeuristicResult(
                    matched=True,
                    intent=IntentType.DIRECT,
                    category_code=spec.code,
                    category_name=spec.name,
                    matched_pattern=pattern.pattern,
                    confidence=1.0,
                    latency_ms=latency_ms,
                    original_input=original,
                )

    # ── Miss: Không khớp pattern nào ────────────────────────────────────────
    latency_ms = (time.perf_counter() - t_start) * 1000
    logger.debug(
        "[HeuristicFilter] NO_MATCH | input=%r | latency=%.3fms",
        normalized[:60], latency_ms
    )
    return None
