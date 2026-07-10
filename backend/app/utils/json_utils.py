import re

def clean_and_extract_json(raw_text: str) -> str:
        """
        Defensive Pipeline to extract and clean JSON
        Removes Markdown ```json or XML tags.
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
        # Sử dụng Regex phi tham lam (Non-greedy match) để bóc tách lõi JSON
        markdown_pattern = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
        match = markdown_pattern.search(cleaned)
        if match:
            cleaned = match.group(1).strip()
        else:
            # Step 3: If regex doesn't match, try to find the first and last curly brace
            # Guard against model generating extra text at the beginning or end
            start_idx = cleaned.find('{')
            end_idx = cleaned.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                cleaned = cleaned[start_idx:end_idx + 1].strip()
                
        return cleaned