import re

try:
    from json_repair import repair_json as _repair_json
    _HAS_JSON_REPAIR = True
except ImportError:
    _HAS_JSON_REPAIR = False


def clean_and_extract_json(raw_text: str) -> str:
    """
    Defensive Pipeline to extract and clean JSON from LLM output.

    Steps:
      1. Extract from <json_output> XML tag (if present)
      2. Extract from Markdown ```json ... ``` fences
      3. Crop to outermost { ... } braces
      4. (Optional) Auto-repair malformed JSON via json-repair library
    """
    if not raw_text:
        return "{}"

    cleaned = raw_text.strip()

    # Step 1: Extract content inside <json_output> tag if present (Priority 1)
    if "<json_output>" in cleaned and "</json_output>" in cleaned:
        try:
            cleaned = cleaned.split("<json_output>")[1].split("</json_output>")[0].strip()
        except Exception:
            pass

    # Step 2: Remove Markdown ```json ... ``` or ``` ... ``` (Priority 2)
    markdown_pattern = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
    match = markdown_pattern.search(cleaned)
    if match:
        cleaned = match.group(1).strip()
    else:
        # Step 3: Crop to outermost curly braces
        start_idx = cleaned.find('{')
        end_idx = cleaned.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx + 1].strip()

    # Step 4: Auto-repair malformed JSON (missing commas, quotes, newlines in strings, etc.)
    # This handles the common case where SLM/small models generate syntactically broken JSON.
    if _HAS_JSON_REPAIR:
        try:
            cleaned = _repair_json(cleaned, return_objects=False)  # type: ignore[arg-type]
        except Exception:
            pass  # Fallback: let json.loads() raise the original error

    return cleaned