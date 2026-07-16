from fastapi import Request

def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None
    return client_ip

def get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "Unknown Agent")