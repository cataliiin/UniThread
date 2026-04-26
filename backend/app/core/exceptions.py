from typing import Any

from fastapi import status


class UniThreadException(Exception):
    """Base exception for all custom UniThread errors."""
    def __init__(
        self,
        message: str,
        code: str = "BAD_REQUEST",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Any = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class NotFoundException(UniThreadException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ForbiddenException(UniThreadException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN
        )


class UnauthorizedException(UniThreadException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ConflictException(UniThreadException):
    def __init__(self, message: str = "Resource conflict occurred"):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT
        )


class InvalidCredentialsException(UniThreadException):
    def __init__(self, message: str = "Invalid email or password."):
        super().__init__(
            message=message,
            code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class UserAlreadyExistsException(ConflictException):
    def __init__(self, message: str = "A user with this email or username already exists."):
        super().__init__(message=message)


class UniversityNotFoundException(NotFoundException):
    def __init__(self, message: str = "The email domain does not match any registered university."):
        super().__init__(message=message)


class UserNotFoundException(NotFoundException):
    def __init__(self, message: str = "User not found."):
        super().__init__(message=message)

class InvalidPasswordException(UniThreadException):
    def __init__(self, message: str = "Incorrect current password."):
        super().__init__(
            message=message,
            code="INVALID_PASSWORD",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class CommunityNotFoundException(NotFoundException):
    def __init__(self, message: str = "Community not found."):
        super().__init__(message=message)

class CommunityNameTakenException(ConflictException):
    def __init__(self, message: str = "A community with this name already exists in your university."):
        super().__init__(message=message)

class NotCommunityAdminException(ForbiddenException):
    def __init__(self, message: str = "You must be a community admin to perform this action."):
        super().__init__(message=message)

class AlreadyCommunityMemberException(ConflictException):
    def __init__(self, message: str = "You are already a member of this community."):
        super().__init__(message=message)

class NotCommunityMemberException(ForbiddenException):
    def __init__(self, message: str = "You are not a member of this community."):
        super().__init__(message=message)

class JoinRequestPendingException(ConflictException):
    def __init__(self, message: str = "Your join request is still pending approval."):
        super().__init__(message=message)

class AnswersRequiredException(UniThreadException):
    def __init__(self, message: str = "You must provide answers to all required questions to join this community."):
        super().__init__(
            message=message,
            code="ANSWERS_REQUIRED",
            status_code=status.HTTP_400_BAD_REQUEST
        )

class InviteLinkExpiredException(UniThreadException):
    def __init__(self, message: str = "This invite link has expired or reached its maximum usage."):
        super().__init__(
            message=message,
            code="INVITE_LINK_EXPIRED",
            status_code=status.HTTP_410_GONE
        )

class InviteLinkNotFoundException(NotFoundException):
    def __init__(self, message: str = "Invite link not found or invalid."):
        super().__init__(message=message)


class PostNotFoundException(NotFoundException):
    def __init__(self, message: str = "Post not found."):
        super().__init__(message=message)

class NotPostAuthorException(ForbiddenException):
    def __init__(self, message: str = "You must be the author to modify this post."):
        super().__init__(message=message)

class AnonymousPostNotAllowedException(ForbiddenException):
    def __init__(self, message: str = "This community does not allow anonymous posts."):
        super().__init__(message=message)
