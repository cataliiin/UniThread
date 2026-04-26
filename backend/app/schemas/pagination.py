from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response schema to wrap list results.
    Prevents overwhelming the client and database with too much data at once.
    """
    items: list[T]
    total: int
    page: int
    size: int
    pages: int
