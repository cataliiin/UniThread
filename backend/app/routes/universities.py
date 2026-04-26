from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.core.dependencies import DbDep
from app.core.exceptions import UniversityNotFoundException
from app.database.models.university import University
from app.schemas.pagination import PaginatedResponse
from app.schemas.university import UniversityResponse

router = APIRouter(prefix="/universities", tags=["Universities"])

@router.get("", response_model=PaginatedResponse[UniversityResponse])
async def list_universities(db: DbDep, page: int = 1, size: int = 50):
    """
    List all registered universities.
    """
    offset = (page - 1) * size
    
    # Get total count
    count_result = await db.execute(select(func.count(University.id)))
    total = count_result.scalar_one()
    
    # Get items
    result = await db.execute(select(University).offset(offset).limit(size))
    items = result.scalars().all()
    
    # Calculate total pages
    pages = (total + size - 1) // size
    
    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/{university_id}", response_model=UniversityResponse)
async def get_university(university_id: UUID, db: DbDep):
    """
    Get details of a specific university. Deep-linkable.
    """
    result = await db.execute(select(University).where(University.id == university_id))
    university = result.scalar_one_or_none()
    
    if not university:
        raise UniversityNotFoundException()
        
    return university
