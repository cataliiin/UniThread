import json
import uuid
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from app.core.config import config

minio_client = Minio(
    config.MINIO_ENDPOINT,
    access_key=config.MINIO_ACCESS_KEY,
    secret_key=config.MINIO_SECRET_KEY,
    secure=config.MINIO_SECURE,
)

BUCKET_USER_ASSETS = "user-assets"
BUCKET_COMMUNITY_ASSETS = "community-assets"
BUCKET_POST_ASSETS = "post-assets"

def _get_public_read_policy(bucket_name: str) -> str:
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
            }
        ],
    }
    return json.dumps(policy)

def init_minio() -> None:
    buckets_to_create = [BUCKET_USER_ASSETS, BUCKET_COMMUNITY_ASSETS, BUCKET_POST_ASSETS]

    for bucket_name in buckets_to_create:
        try:
            if not minio_client.bucket_exists(bucket_name):
                minio_client.make_bucket(bucket_name)
                print(f"Created MinIO bucket: {bucket_name}")
            
            policy = _get_public_read_policy(bucket_name)
            minio_client.set_bucket_policy(bucket_name, policy)
            print(f"Set public-read policy for bucket: {bucket_name}")
        except S3Error as e:
            print(f"Error initializing MinIO bucket {bucket_name}: {e}")

def generate_presigned_upload_url(bucket_name: str, expires_in_minutes: int = 15) -> tuple[str, str]:
    file_key = str(uuid.uuid4())
    
    try:
        url = minio_client.presigned_put_object(
            bucket_name=bucket_name,
            object_name=file_key,
            expires=timedelta(minutes=expires_in_minutes),
        )
        return url, file_key
    except S3Error as e:
        print(f"Failed to generate presigned URL for {bucket_name}: {e}")
        raise
