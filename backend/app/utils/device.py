from user_agents import parse as user_agents_parse

def parse_device_info(ua_string: str) -> str:
    if not ua_string:
        return "Thiết bị ẩn danh"
    ua = user_agents_parse(ua_string)
    
    os_name = ua.os.family
    if "Mac OS" in os_name:
        os_name = "MacBook"
    elif "Windows" in os_name:
        os_name = "Windows PC"
        
    # Xác định trình duyệt
    browser_name = ua.browser.family
    
    # Nếu là Mobile, lấy tên Model (Ví dụ: iPhone, Samsung)
    if ua.is_mobile:
        return f"{ua.device.family} — {browser_name}"
        
    return f"{os_name} — {browser_name}"
