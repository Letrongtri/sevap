from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.exceptions import (
    UserAlreadyExistsError, 
    NotFoundError,
)
from app.utils.password import hash_password

class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def create_user(self, employee_code: str, full_name: str, 
                            password: str, email: str | None = None) -> User:
        existing = await self.repo.get_user_by_employee_code(employee_code)
        if existing is not None:
            raise UserAlreadyExistsError()
        
        hashed_password = hash_password(password)
        
        db_user = User(
            employee_code=employee_code, 
            full_name=full_name, 
            email=email, 
            password=hashed_password
        )
        return await self.repo.create_user(db_user)

        
    # async def get_current_user(self, user_id: int):
    #     # Verify user exists in database
    #     user = await self.repo.get_user_by_id(user_id)
    #     if user is None:
    #         raise NotFoundError()

    #     return user
