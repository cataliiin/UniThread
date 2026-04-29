from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UniversityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    domain: str = Field(..., min_length=4, max_length=100)


class UniversityCreate(UniversityBase):
    pass


class UniversityResponse(UniversityBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
