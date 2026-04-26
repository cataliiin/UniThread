from fastapi import APIRouter, status

from app.core.exceptions import StorageUnavailableException
from app.core.dependencies import CurrentUser
from app.core.storage import (
    StorageServiceUnavailableError,
    generate_presigned_upload_url,
)
from app.schemas.storage import PresignedUrlRequest, PresignedUrlResponse

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.post("/presigned-url", response_model=PresignedUrlResponse, status_code=status.HTTP_201_CREATED)
async def get_presigned_url(request: PresignedUrlRequest, current_user: CurrentUser):
    """
    Generate a presigned URL for uploading a file directly to MinIO.
    This avoids routing large file uploads through the FastAPI backend.
    """
    try:
        url, file_key = generate_presigned_upload_url(bucket_name=request.bucket_name.value)
    except StorageServiceUnavailableError as exc:
        raise StorageUnavailableException(str(exc)) from exc
    
    return PresignedUrlResponse(url=url, file_key=file_key)
