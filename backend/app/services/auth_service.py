from app.repositories.user_repository import UserRepository
from app.services.exceptions import (
    InvalidCredentialsError, 
    NotFoundError,
)
from app.utils.password import verify_password

class AuthService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def login(self, employee_code: str, password: str):
        user = await self.repo.get_user_by_employee_code(employee_code)
        if not user or not verify_password(password, user.password):
            raise InvalidCredentialsError()
        
        return user
        
    async def get_current_user(self, user_id: int):
        # Verify user exists in database
        user = await self.repo.get_user_by_id(user_id)
        if user is None:
            raise NotFoundError()

        return user
