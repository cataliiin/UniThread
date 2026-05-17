import json
import urllib.request
import uuid
from datetime import timedelta

from minio import Minio
from minio.error import S3Error
from urllib3.exceptions import MaxRetryError

from app.core.config import config

def _get_minio_endpoint() -> str:
    endpoint = config.MINIO_ENDPOINT
    # If the endpoint is configured as the Docker hostname 'minio' but we are running outside Docker (host-level),
    # automatically translate it to 'localhost' for seamless portability and developer experience.
    import os
    if "minio:" in endpoint and not os.path.exists('/.dockerenv'):
        return endpoint.replace("minio:", "localhost:", 1)
    return endpoint

minio_client = Minio(
    _get_minio_endpoint(),
    access_key=config.MINIO_ACCESS_KEY,
    secret_key=config.MINIO_SECRET_KEY,
    secure=config.MINIO_SECURE,
    region="us-east-1",
)


def _get_signing_minio_client() -> Minio:
    # To generate valid presigned URLs for browser clients, the signing host in the S3 signature
    # must match the host that the browser actually connects to (e.g., 'localhost:9000' or an Nginx domain).
    # If a MINIO_PUBLIC_URL is configured, we extract the host and use a dedicated MinIO client for signing.
    if config.MINIO_PUBLIC_URL:
        from urllib.parse import urlparse
        parsed = urlparse(config.MINIO_PUBLIC_URL)
        signing_host = parsed.netloc  # e.g., 'localhost:9000' or 'localhost'
        signing_secure = parsed.scheme == "https"
        return Minio(
            signing_host,
            access_key=config.MINIO_ACCESS_KEY,
            secret_key=config.MINIO_SECRET_KEY,
            secure=signing_secure,
            region="us-east-1",  # Explicitly set region to enable offline signature calculation without network calls!
        )
    return minio_client


BUCKET_USER_ASSETS = "user-assets"
BUCKET_COMMUNITY_ASSETS = "community-assets"
BUCKET_POST_ASSETS = "post-assets"
BUCKET_MARKETPLACE_ASSETS = "marketplace-assets"
BUCKET_ACADEMIC_LIBRARY = "academic-library"


class StorageServiceUnavailableError(Exception):
    """Raised when the MinIO service cannot be reached."""


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
    buckets_to_create = {
        BUCKET_USER_ASSETS: "public",
        BUCKET_COMMUNITY_ASSETS: "public",
        BUCKET_POST_ASSETS: "public",
        BUCKET_MARKETPLACE_ASSETS: "public",
        BUCKET_ACADEMIC_LIBRARY: "private",
    }

    for bucket_name, mode in buckets_to_create.items():
        try:
            if not minio_client.bucket_exists(bucket_name):
                minio_client.make_bucket(bucket_name)
                print(f"Created MinIO bucket: {bucket_name}")

            if mode == "public":
                policy = _get_public_read_policy(bucket_name)
                minio_client.set_bucket_policy(bucket_name, policy)
                print(f"Set public-read policy for bucket: {bucket_name}")
        except S3Error as e:
            print(f"Error initializing MinIO bucket {bucket_name}: {e}")
        except Exception as e:
            print(
                f"MinIO connection failed for {bucket_name}. Ensure MinIO is running. Error: {e}"
            )
            break


def check_minio_health() -> bool:
    protocol = "https" if config.MINIO_SECURE else "http"
    endpoint = _get_minio_endpoint()
    url = f"{protocol}://{endpoint}/minio/health/live"
    try:
        urllib.request.urlopen(url, timeout=1.0)
        return True
    except Exception:
        return False


def generate_presigned_upload_url(
    bucket_name: str, expires_in_minutes: int = 15
) -> tuple[str, str]:
    file_key = str(uuid.uuid4())

    try:
        signing_client = _get_signing_minio_client()
        url = signing_client.presigned_put_object(
            bucket_name=bucket_name,
            object_name=file_key,
            expires=timedelta(minutes=expires_in_minutes),
        )
        
        # If a public URL is configured, replace the scheme and netloc with the public URL,
        # ensuring that any path prefix (like '/storage') is correctly preserved/injected.
        if config.MINIO_PUBLIC_URL:
            public_prefix = config.MINIO_PUBLIC_URL.rstrip("/")
            from urllib.parse import urlparse
            parsed_signed = urlparse(url)
            
            signed_path_and_query = parsed_signed.path
            if parsed_signed.query:
                signed_path_and_query += f"?{parsed_signed.query}"
                
            url = f"{public_prefix}{signed_path_and_query}"

        return url, file_key
    except (S3Error, MaxRetryError, OSError) as e:
        print(f"Failed to generate presigned URL for {bucket_name}: {e}")
        raise StorageServiceUnavailableError(
            "Storage service is currently unavailable. Please try again later."
        ) from e
