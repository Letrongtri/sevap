import re
from dataclasses import dataclass, field
from app.core.enum import IntentType

@dataclass
class HeuristicResult:
    """Kết quả phân loại từ Tier-0 Heuristic Filter."""
    matched        : bool
    intent         : IntentType
    category_code  : str              # Vd: "C01", "C03"
    category_name  : str              # Vd: "greeting", "thanks"
    matched_pattern: str              # Pattern đã khớp (để debug/audit)
    confidence     : float            # Luôn là 1.0 khi matched (rule-based)
    latency_ms     : float            # Thời gian xử lý (ms) để monitor
    original_input : str              # Câu hỏi gốc trước normalize


@dataclass
class CategorySpec:
    """Đặc tả một nhóm pattern. Dùng nội bộ."""
    code         : str
    name         : str
    raw_patterns : list[str]
    # Được gán sau khi compile
    compiled     : list[re.Pattern] = field(default_factory=list, init=False)


# ─────────────────────────────────────────────────────────────────────────────
# EXCLUSION GUARD — Từ khoá nghiệp vụ → KHÔNG được là "direct"
# ─────────────────────────────────────────────────────────────────────────────

BUSINESS_KEYWORDS: frozenset[str] = frozenset([
    # Lương & phúc lợi
    "lương", "salary", "tiền lương", "thưởng", "bonus", "phụ cấp", "trợ cấp",
    "bảo hiểm", "bhxh", "bhyt", "bhtn", "thai sản", "ốm đau",
    "phép", "nghỉ phép", "ngày phép", "phép năm", "nghỉ lễ", "nghỉ tết",
    "nghỉ không lương", "nghỉ có lương",
    # Hợp đồng
    "hợp đồng", "hdld", "contract", "thử việc", "probation",
    "chính thức", "part-time", "full-time", "freelance",
    # Quy chế & chính sách
    "quy chế", "nội quy", "chính sách", "quy định", "quy trình",
    "policy", "rule", "regulation", "procedure",
    # Tuyển dụng & nhân sự
    "tuyển dụng", "tuyển", "hiring", "onboarding", "offboarding",
    "sa thải", "thôi việc", "nghỉ việc", "resign", "terminate",
    "kỷ luật", "cảnh cáo", "khen thưởng",
    # Chấm công & làm việc
    "chấm công", "tăng ca", "overtime", "ca làm việc", "giờ làm",
    "công tác", "business trip", "công tác phí",
    # Đánh giá & kpi
    "kpi", "đánh giá", "performance", "review", "okr", "target",
    # Phòng ban & chức danh
    "phòng ban", "department", "chức danh", "chức vụ", "title",
    "thăng chức", "promotion", "transfer", "điều chuyển",
    # Đào tạo
    "đào tạo", "training", "học", "khóa học", "chứng chỉ", "certificate",
])

# ─────────────────────────────────────────────────────────────────────────────
# PATTERN DEFINITIONS — Tổ chức theo Category
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_SPECS: list[CategorySpec] = [

    # ──────────────────────────────────────────────────────────────────────────
    # C01 · GREETING — Chào hỏi đầu hội thoại
    # Nguyên tắc: Chỉ bắt câu chào thuần túy, không kèm nội dung thực chất.
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C01",
        name="greeting",
        raw_patterns=[
            # Chào cơ bản — có/không có "xin"
            r"^(xin\s+)?chào[!.,?\s]*$",
            r"^(xin\s+)?chào\s+(bạn|anh|chị|em|mọi\s+người)[!.,?\s]*$",

            # Chào theo buổi
            r"^(xin\s+)?chào\s+(buổi\s+)?(sáng|chiều|tối|trưa|ngày)[!.,?\s]*$",
            r"^good\s+(morning|afternoon|evening|night|day)[!.,?\s]*$",

            # Tiếng Anh / Viết tắt phổ biến
            r"^(hello|hi+|hey+|helo|howdy|sup|yo)[!.,?\s]*$",
            r"^(hê|hê+\s*lô|hê\s*lô)[!.,?\s]*$",

            # Chào kết hợp dấu hiệu bắt đầu hội thoại
            r"^(alo|ồ\s+chào|à\s+chào|ừ\s+chào|ôi\s+chào)[!.,?\s]*$",
            r"^(chào\s+mừng(\s+bạn)?)[!.,?\s]*$",

            # Gọi/gọi bot
            r"^(ê|ơi|này|hey)[,\s]*(bạn|bot|trợ\s+lý(\s+ảo)?|assistant|ai|hệ\s+thống)?[!.,?\s]*$",

            # Bắt đầu bằng tên thân mật
            r"^(em\s+chào|con\s+chào|mình\s+chào|anh\s+chào|chị\s+chào)\s+(anh|chị|em|bạn|thầy|cô)[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C02 · FAREWELL — Kết thúc, tạm biệt
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C02",
        name="farewell",
        raw_patterns=[
            # Cơ bản
            r"^(tạm\s+biệt|tạm\s+biệt\s+(nhé|nha|bạn|anh|chị|em|bé))[!.,?\s]*$",
            r"^(bye+|goodbye|good\s*bye|bái+|bai+\s*bai+|bái\s*bái)[!.,?\s]*$",
            r"^(see\s+you(\s+(later|soon|tomorrow|next\s+time))?)[!.,?\s]*$",

            # Hẹn gặp lại — bắt cả: "hẹn gặp lại", "hẹn gặp lại sau", "hẹn gặp sau"
            r"^hẹn\s+(gặp\s+)?lại(\s+sau)?(\s+(nhé|nha|bạn|ạ|anh|chị|em|bé))?[!.,?\s]*$",
            r"^hẹn\s+(gặp\s+)?sau(\s+(nhé|nha|bạn|ạ|anh|chị|em|bé))?[!.,?\s]*$",
            r"^gặp\s+lại(\s+(sau|nhé|nha|bạn|ạ|anh|chị|em|bé))?[!.,?\s]*$",

            # Kết thúc cuộc trò chuyện
            r"^(thôi\s+(nhé|nha|mình\s+đi|bye|tạm\s+biệt))[!.,?\s]*$",
            r"^(ok|oke?)\s+(bye|tạm\s+biệt|nhé)[!.,?\s]*$",
            r"^(mình\s+)?(đi\s+)?(nhé|nha|rồi)[!.,?\s]*$",

            # Cảm ơn + tạm biệt
            r"^cảm\s+ơn\s+(và\s+)?(tạm\s+biệt|bye)[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C03 · THANKS — Cảm ơn, ghi nhận
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C03",
        name="thanks",
        raw_patterns=[
            # Cảm ơn cơ bản
            r"^cảm\s+ơn[!.,?\s]*$",
            r"^cảm\s+ơn\s+(bạn|anh|chị|em|nhiều|lắm|rất\s+nhiều|lắm\s+(nhé|nha)|nhé|nha|ạ)[!.,?\s]*$",
            r"^cảm\s+ơn\s+(trợ\s+lý(\s+ảo)?|bot|hệ\s+thống)(\s+(nhiều|lắm|nhé|ạ))?[!.,?\s]*$",

            # Mở rộng tiếng Việt
            r"^(cám\s+ơn|cảm\s+tạ|đội\s+ơn)(\s+(bạn|nhiều|lắm|ạ))?[!.,?\s]*$",
            r"^(ơn\s+trời|ơn\s+giời)(\s+(bạn|nhiều))?[!.,?\s]*$",

            # Tiếng Anh / Viết tắt
            r"^(thanks?(\s+(a\s+lot|so\s+much|very\s+much|bro|man))?)[!.,?\s]*$",
            r"^(thank\s+you(\s+(so\s+much|very\s+much|a\s+lot))?)[!.,?\s]*$",
            r"^(ty|thx|tks|tnx)[!.,?\s]*$",

            # Kết hợp với ok
            r"^(ok|oke?|được)[,.\s]+cảm\s+ơn[!.,?\s]*$",

            # Cảm ơn ngầm
            r"^(bạn\s+thật\s+(tốt|tuyệt|giỏi|hữu\s+ích))[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C04 · ACKNOWLEDGEMENT — Xác nhận, hiểu rồi, đồng ý
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C04",
        name="acknowledgement",
        raw_patterns=[
            # Ok / Được
            r"^(ok+|oke+|okay+|okey)[!.,?\s]*$",
            r"^(được(\s+(rồi|nhé|nha|ạ))?)[!.,?\s]*$",

            # Vâng / Dạ / Ừ
            r"^(vâng|dạ|ừ+|ừm+|uh+|uhm+|um+)[!.,?\s]*$",
            r"^(vâng(\s+(ạ|rồi|được))?)[!.,?\s]*$",
            r"^(dạ(\s+(vâng|được|rồi|ạ))?)[!.,?\s]*$",

            # Hiểu rồi
            r"^(hiểu(\s+rồi)?)[!.,?\s]*$",
            r"^(đã\s+hiểu|hiểu\s+ý|hiểu\s+rồi|nắm\s+(được\s+)?rồi)[!.,?\s]*$",
            r"^(rõ(\s+rồi)?|rõ\s+ràng\s+rồi)[!.,?\s]*$",
            r"^(i\s+(see|understand|got\s+it))[!.,?\s]*$",
            r"^(got\s+it|noted|understood|roger(\s+that)?)[!.,?\s]*$",

            # Đúng rồi
            r"^(đúng(\s+rồi|\s+vậy|\s+ý|\s+thế)?)[!.,?\s]*$",
            r"^(chính\s+xác(\s+(rồi|ạ))?)[!.,?\s]*$",
            r"^(đúng\s+(điều\s+|ý\s+)?tôi\s+(muốn\s+hỏi|cần))[!.,?\s]*$",

            # Tiếp tục
            r"^(tiếp\s+(tục|đi|thôi|nào)|tiếp\s+theo(\s+(thôi|đi|nào))?)[!.,?\s]*$",
            r"^(continue|next|go\s+(on|ahead))[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C05 · NEGATION_SIMPLE — Phủ nhận ngắn, không kèm yêu cầu mới
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C05",
        name="negation_simple",
        raw_patterns=[
            # Không
            r"^(không(\s+(phải|cần|sao|có\s+gì|ạ|đâu))?)[!.,?\s]*$",
            r"^(không\s+(cần\s+)?nữa(\s+đâu)?)[!.,?\s]*$",

            # Thôi không
            r"^(thôi\s+)?(không\s+(cần|hỏi|muốn)\s+(gì\s+)?nữa)[!.,?\s]*$",

            # Tiếng Anh
            r"^(nope|nah|no(\s+(thanks?|thank\s+you|need))?)[!.,?\s]*$",
            r"^(it'?s?\s+(ok(ay)?|fine|alright))[!.,?\s]*$",

            # Không sao
            r"^(không\s+sao(\s+(ạ|đâu|cả))?)[!.,?\s]*$",
            r"^(thôi\s+được(\s+rồi)?)[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C06 · BOT_IDENTITY — Hỏi về danh tính, tên, khả năng của bot
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C06",
        name="bot_identity",
        raw_patterns=[
            # Bạn là ai / là gì
            r"bạn\s+(là\s+)?(ai|gì|cái\s+gì|loại\s+(gì|bot\s+gì|ai\s+gì))\s*[?!.]*$",
            r"(trợ\s+lý(\s+ảo)?|bot|assistant)\s+(này\s+)?(là\s+)?(ai|gì)\s*[?!.]*$",

            # Tên
            r"bạn\s+(tên\s+(gì|là\s+gì)|có\s+tên\s+không)\s*[?!.]*$",
            r"(tên|name)\s+(của\s+)?bạn\s+(là\s+gì|là\s+j)\s*[?!.]*$",

            # Khả năng
            r"bạn\s+(có\s+thể\s+)?(làm|giúp|hỗ\s+trợ)\s+(gì|được\s+gì|những\s+gì)\s*[?!.]*$",
            r"bạn\s+(biết|hiểu)\s+(gì|những\s+gì|về\s+gì)\s*[?!.]*$",
            r"bạn\s+hỗ\s+trợ\s+(những\s+)?(gì|vấn\s+đề\s+gì|loại\s+câu\s+hỏi\s+nào)\s*[?!.]*$",
            r"(có\s+thể\s+)?hỏi\s+bạn\s+(về\s+)?(những\s+gì|gì|vấn\s+đề\s+gì)\s*[?!.]*$",

            # Ai tạo ra
            r"(ai|công\s+ty\s+nào)\s+(tạo|xây\s+dựng|phát\s+triển|làm)\s+(ra\s+)?bạn\s*[?!.]*$",
            r"bạn\s+(được\s+)?(tạo|xây\s+dựng|phát\s+triển)\s+(bởi|bởi\s+ai)\s*[?!.]*$",

            # Tiếng Anh
            r"^who\s+are\s+you\s*[?!.]*$",
            r"^what\s+(are|can)\s+you\s+(do|help\s+with)\s*[?!.]*$",
            r"^(what'?s?\s+your\s+name|your\s+name\s+(please|is))\s*[?!.]*$",

            # Giới thiệu bản thân
            r"(giới\s+thiệu|tự\s+giới\s+thiệu)\s+(về\s+)?(bản\s+thân|mình|bạn)\s*(đi|nào|nhé)?\s*[?!.]*$",
            r"^(bạn\s+là\s+gì|mày\s+là\s+ai|mày\s+là\s+gì)\s*[?!.]*$",

            # Hỏi về phiên bản / model
            r"(bạn|hệ\s+thống)\s+(đang\s+)?dùng\s+(model|mô\s+hình)\s+(gì|nào)\s*[?!.]*$",
            r"(phiên\s+bản|version)\s+(của\s+)?bạn\s+(là\s+gì|là\s+bao\s+nhiêu)\s*[?!.]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C07 · SYSTEM_USAGE — Hướng dẫn sử dụng hệ thống
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C07",
        name="system_usage",
        raw_patterns=[
            # Cách hỏi
            r"(tôi|mình|người\s+dùng)\s+(có\s+thể\s+|nên\s+)?hỏi\s+(gì|như\s+thế\s+nào|thế\s+nào|kiểu\s+gì)\s*[?!.]*$",
            r"(cách|làm\s+thế\s+nào\s+để)\s+(hỏi|đặt\s+câu\s+hỏi)(\s+cho\s+bạn)?\s*[?!.]*$",
            r"(tôi|mình)\s+(nên|có\s+thể)\s+hỏi\s+(về\s+)?(gì|vấn\s+đề\s+gì|những\s+gì)\s*[?!.]*$",

            # Hướng dẫn sử dụng
            r"(hướng\s+dẫn|guide|tutorial)\s+(sử\s+dụng|dùng|cách\s+(dùng|sử\s+dụng))(\s+(hệ\s+thống|ứng\s+dụng|bot))?\s*[?!.]*$",
            r"(cách|làm\s+sao)\s+(để\s+)?(sử\s+dụng|dùng)\s+(hệ\s+thống|ứng\s+dụng|trợ\s+lý(\s+ảo)?)\s*[?!.]*$",

            # Hệ thống hỗ trợ gì
            r"(hệ\s+thống|ứng\s+dụng|bot)\s+(này\s+)?(hỗ\s+trợ|có\s+thể\s+(làm|giúp)|làm\s+được)\s+(gì|những\s+gì)\s*[?!.]*$",
            r"(hệ\s+thống|ứng\s+dụng)\s+(này\s+)?(dùng\s+để\s+làm\s+gì|làm\s+gì)\s*[?!.]*$",

            # Câu hỏi ngắn về help
            r"^(help|trợ\s+giúp|giúp\s+(tôi\s+)?với|hỗ\s+trợ(\s+tôi)?)\s*[?!.]*$",
            r"^(hướng\s+dẫn(\s+tôi)?|chỉ\s+(tôi\s+)?cách)\s*[?!.]*$",
            r"^(menu|options?|lựa\s+chọn|tùy\s+chọn)\s*[?!.]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C08 · SMALL_TALK — Hỏi thăm, xã giao
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C08",
        name="small_talk",
        raw_patterns=[
            # Hỏi thăm bot
            r"bạn\s+(có\s+)?(khỏe|ổn)\s+(không|chưa|chứ)\s*[?!.]*$",
            r"(hôm\s+nay\s+)?bạn\s+(thế\s+nào|ra\s+sao)\s*[?!.]*$",
            r"^how\s+are\s+you(\s+(doing|today))?\s*[?!.]*$",
            r"^(what'?s?\s+up|wassup|sup)\s*[?!.]*$",

            # Bot có cảm xúc không
            r"bạn\s+(có\s+)?(cảm\s+xúc|cảm\s+giác|buồn|vui|mệt)\s*(không|chứ)?\s*[?!.]*$",
            r"bạn\s+(có\s+)?biết\s+(cảm\s+giác|cảm\s+xúc)\s+(là\s+gì|không)\s*[?!.]*$",

            # Câu hỏi triết học / vui / test
            r"^(bạn\s+có\s+ý\s+thức\s+không|bạn\s+có\s+thực\s+sự\s+thông\s+minh\s+không)\s*[?!.]*$",
            r"^(bạn\s+nghĩ\s+gì\s+về\s+cuộc\s+sống|bạn\s+yêu\s+thích\s+gì)\s*[?!.]*$",

            # Chúc
            r"^(chúc\s+(bạn|mừng)(\s+(ngày\s+mới|buổi\s+sáng|cuối\s+tuần|vui\s+vẻ|thành\s+công))?)[!.,?\s]*$",
            r"^(happy\s+(new\s+year|birthday|holiday|weekend))[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C09 · POSITIVE_FEEDBACK — Phản hồi tích cực, khen ngợi
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C09",
        name="positive_feedback",
        raw_patterns=[
            # Tốt / hay
            r"^(tốt\s+(lắm|quá|thật|đấy|nhỉ|vậy)?)[!.,?\s]*$",
            r"^(hay\s+(đấy|quá|lắm|thật|vậy|nhỉ)?)[!.,?\s]*$",

            # Tuyệt / xuất sắc
            r"^(tuyệt\s+(vời|quá|lắm|đấy|nhỉ)?)[!.,?\s]*$",
            r"^(xuất\s+sắc|giỏi\s+(lắm|quá)|giỏi\s+(thật|vậy))[!.,?\s]*$",
            r"^(đỉnh\s+(thật|quá|lắm|vậy|của\s+đỉnh)?)[!.,?\s]*$",
            r"^(xịn\s+(lắm|quá|nhỉ|vậy)?)[!.,?\s]*$",
            r"^(đỉnh\s+kout?|đỉnh\s+nóc|siêu\s+(xịn|hay|tốt))[!.,?\s]*$",

            # Tiếng Anh
            r"^(perfect|great|awesome|excellent|wonderful|amazing|fantastic|brilliant)[!.,?\s]*$",
            r"^(nice|cool|good\s+(job|answer|response)?)[!.,?\s]*$",
            r"^(wow+|wao+|woah+)[!.,?\s]*$",
            r"^(impressive|helpful|useful|very\s+(good|helpful|useful))[!.,?\s]*$",

            # Hữu ích
            r"^(rất\s+)?(hữu\s+ích|hữu\s+dụng|thực\s+tế)(\s+(lắm|quá|nhỉ))?[!.,?\s]*$",
            r"^(câu\s+trả\s+lời\s+)?(hay|tốt|đúng|chính\s+xác)(\s+(lắm|quá))?[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C10 · APOLOGY_RETRACT — Xin lỗi, rút lại, hỏi lại
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C10",
        name="apology_retract",
        raw_patterns=[
            # Xin lỗi
            r"^(xin\s+lỗi|sorry+|pardon|excuse\s+me)[!.,?\s,ạ]*$",
            r"^(xin\s+lỗi\s+(bạn|vì|về|nhé|ạ))[!.,?\s]*$",
            r"^(ôi\s+xin\s+lỗi|ồ\s+xin\s+lỗi|ái\s+xin\s+lỗi)[!.,?\s]*$",

            # Lỡ tay / nhầm
            r"^(lỡ\s+(tay|gõ|nhấn)|nhầm(\s+rồi)?|gõ\s+nhầm)[!.,?\s]*$",
            r"^(câu\s+hỏi\s+)?(trước|vừa\s+rồi)\s+(của\s+tôi\s+)?(bỏ\s+qua|quên\s+đi|không\s+tính)[!.,?\s]*$",

            # Hỏi lại
            r"^(tôi\s+)?(hỏi\s+lại|thử\s+lại)(\s+(nhé|nha|được\s+không))?[!.,?\s]*$",
            r"^(cho\s+tôi\s+)?(đặt\s+)?(câu\s+hỏi\s+)?(lại|mới)(\s+(nhé|nha))?[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C11 · CONFIRMATION — Yes/No sau khi bot hỏi ngược
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C11",
        name="confirmation",
        raw_patterns=[
            # Yes
            r"^(có|yes|yeah|yep|yup|ừ|đúng|phải|đúng\s+vậy|chính\s+xác)(\s+(ạ|nhé|nha))?[!.,?\s]*$",

            # No
            r"^(không|no|nope|nah|sai|không\s+phải|không\s+đúng)(\s+(ạ|nhé|đâu))?[!.,?\s]*$",

            # Câu xác nhận ngắn
            r"^(đúng\s+(ạ|rồi)|phải\s+rồi|chính\s+xác\s+rồi)[!.,?\s]*$",
            r"^(không\s+(phải\s+)?(vậy|thế|đâu)(\s+ạ)?)[!.,?\s]*$",

            # Tiếp tục hay không
            r"^(tiếp\s+tục\s+(đi|thôi|nhé)|thôi\s+dừng\s+lại)[!.,?\s]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C12 · FILLER_NOISE — Ký tự thừa, input test, vô nghĩa
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C12",
        name="filler_noise",
        raw_patterns=[
            # Chỉ ký tự đặc biệt / số
            r"^[\s.,!?;:…\-_]+$",
            r"^[0-9\s.,!?]+$",

            # Lặp ký tự (mashing keyboard)
            r"^(.)\1{4,}$",                         # aaaaa, ?????
            r"^[a-z]{1,3}(\s+[a-z]{1,3}){0,2}$",  # a b c, xx yy

            # Test input phổ biến
            r"^(test|thử|ping|hi\s+test|test\s+\d*)[!.,?\s]*$",
            r"^(\.\.\.|…+)[!.,?\s]*$",

            # Ký tự đơn lẻ
            r"^[a-zA-ZÀ-ỹ]{1,2}[!?,.\s]*$",

            # Emoji-only (common in Vietnamese chat)
            r"^[\U0001F000-\U0001FFFF\s]+$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C13 · TIME_DATE_SIMPLE — Hỏi giờ/ngày không kèm nghiệp vụ
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C13",
        name="time_date_simple",
        raw_patterns=[
            # Hỏi giờ
            r"^(mấy\s+giờ|giờ\s+mấy|bây\s+giờ\s+là\s+mấy\s+giờ)\s+(rồi\s+)?(vậy|nhỉ|nhé)?\s*[?!.]*$",
            r"^(what\s+time\s+is\s+it(\s+now)?)\s*[?!.]*$",

            # Hỏi ngày
            r"^(hôm\s+nay\s+(là\s+)?(ngày|thứ)\s+(mấy|gì|bao\s+nhiêu))\s*[?!.]*$",
            r"^(ngày\s+(hôm\s+nay\s+)?là\s+(mấy|bao\s+nhiêu))\s*[?!.]*$",
            r"^(today(\s+is)?\s+(what\s+day|which\s+date))\s*[?!.]*$",

            # Hỏi tháng/năm đơn giản
            r"^(tháng\s+(mấy|này\s+là\s+tháng\s+mấy)|năm\s+nay\s+là\s+năm\s+(gì|bao\s+nhiêu))\s*[?!.]*$",
        ],
    ),

    # ──────────────────────────────────────────────────────────────────────────
    # C14 · BOT_STATE — Hỏi trạng thái hoạt động của hệ thống
    # ──────────────────────────────────────────────────────────────────────────
    CategorySpec(
        code="C14",
        name="bot_state",
        raw_patterns=[
            # Hoạt động không
            r"(bạn|hệ\s+thống|bot)\s+(có\s+)?(đang\s+)?(hoạt\s+động|online|chạy|sẵn\s+sàng)\s+(không|chứ)\s*[?!.]*$",
            r"(bạn|hệ\s+thống)\s+(đang\s+)?nghe\s+(tôi\s+)?(không|chứ)\s*[?!.]*$",
            r"^(are\s+you\s+there|you\s+still\s+there\??|anybody\s+there\??)\s*[?!.]*$",

            # Đọc được không
            r"(bạn|bot)\s+(có\s+)?(đọc|nghe|thấy|nhận)\s+(được\s+)?(tin\s+nhắn\s+)?này\s+(không|chứ)\s*[?!.]*$",

            # Câu bắt đầu đơn giản
            r"^(bắt\s+đầu(\s+(thôi|nào|đi))?)[!.,?\s]*$",
            r"^(start|begin|let'?s?\s+(start|go|begin))[!.,?\s]*$",
        ],
    ),
]
