import bcrypt

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify if the provided password matches the hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")