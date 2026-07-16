from datetime import datetime, timezone

def calculate_status(created_at: datetime, is_current: bool) -> str:
    if is_current:
        return "Active now"
    
    # Tính khoảng thời gian chênh lệch (UTC hoặc theo timezone hệ thống)
    delta = datetime.now(timezone.utc) - created_at
    hours = delta.seconds // 3600
    if hours == 0:
        minutes = delta.seconds // 60
        return f"Active {minutes} minutes ago" if minutes > 0 else "Active just now"
    if hours < 24:
        return f"Active {hours} hours ago"
    days = hours // 24
    if days < 7:
        return f"Active {days} days ago"
    months = days // 30
    if months < 12:
        return f"Active {months} months ago"
    return f"Active {days // 365} years ago"
