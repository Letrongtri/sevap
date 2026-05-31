from typing import List

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.exceptions import (
    UserAlreadyExistsError, 
    NotFoundError,
    InvalidPasswordError
)
from app.core.config import settings
from app.utils.auth import hash_password, verify_password

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
    
    async def get_user_by_id(self, user_id: int) -> User | None:
        user = await self.repo.get_user_by_id(user_id)
        if user is None:
            raise NotFoundError()
        return user
    
    async def get_all_users(self) -> List[User]:
        return await self.repo.get_all_users()

    async def update_user(self, user_id: int, full_name: str | None = None, 
                          email: str | None = None, active: bool | None = None) -> User:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        if full_name is not None:
            existing.full_name = full_name
        if email is not None:
            existing.email = email
        if active is not None:
            existing.is_active = active

        await self.repo.save(user=existing)
        return existing
    
    async def delete_user(self, user_id: int) -> User:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        await self.repo.delete_user(existing)
        return existing

    async def reset_user_password(self, user_id: int) -> User:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        default_password = settings.DEFAULT_USER_PASSWORD
        existing.password = hash_password(default_password)
        await self.repo.save(user=existing)
        return existing
    
    async def change_user_password(self, user_id: int, old_password: str, new_password: str) -> User | None:
        existing = await self.repo.get_user_by_id(user_id)
        if existing is None:
            raise NotFoundError()
        
        if not verify_password(old_password, existing.password):
            raise InvalidPasswordError()
        
        existing.password = hash_password(new_password)

        await self.repo.save(user=existing)
        return existing
