"""
Authentication service — handles registration, login, and token management.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


class AuthService:
    """Business logic for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> User:
        """Register a new recruiter account."""
        # Check for existing user
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ValueError("A user with this email already exists.")

        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=UserRole.RECRUITER,
        )
        return await self.repo.create(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        """Authenticate and return JWT tokens."""
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password.")

        if not user.is_active:
            raise ValueError("Account is deactivated.")

        tokens = self._create_tokens(user)
        return tokens

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """Issue new tokens from a valid refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid or expired refresh token.")

        user_id = payload.get("sub")
        user = await self.repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive.")

        return self._create_tokens(user)

    def _create_tokens(self, user: User) -> TokenResponse:
        """Generate access and refresh token pair."""
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )
